const fs = require('fs-extra');
const path = require('path');

const src_path = path.resolve(__dirname, '..', 'static', 'tutorials');
const out_path = path.join(src_path, 'out');

fs.removeSync(out_path);

fs.ensureDirSync(out_path);

fs.copySync(path.join(src_path, 'tutorials.json'), path.join(out_path, 'tutorials.json'));

const tutorials = require(path.join(src_path, 'tutorials.json'));

// find all top level tutorials
const top_level = {};
const child = {};
Object.keys(tutorials).forEach(tut_name => {
    if (!child[tut_name]) {
        top_level[tut_name] = true;;
    }
    const tut = tutorials[tut_name];
    if (tut.children) {
        tut.children.forEach((child_tut, child_idx) => {
            child[child_tut] = true;
            delete top_level[child_tut];
            tutorials[child_tut].parent = tut_name;
            tutorials[child_tut].siblings = tut.children;
            tutorials[child_tut].sibling_idx = child_idx;

        });
    }
});

function resolve_next(list, index) {
    const self = tutorials[list[index]];
    if (self.children) {
        self.next = self.children[0];
        for (let i=0;i<self.children.length;i++) {
            resolve_next(self.children, i);
            resolve_prev(self.children, i);
        }
    } else {
        if (index !== list.length-1) {
            self.next = list[index+1];
        } else {
            function resolve_parent(me) {
                const parent = tutorials[me.parent];
                if (parent) {
                    if (parent.sibling_idx !== parent.siblings.length-1) {
                        return parent.siblings[parent.sibling_idx+1];
                    } else {
                        return resolve_parent(parent);
                    }
                }
            }
            const parent = resolve_parent(self);
            if (parent) {
                self.next = parent;
            }
        }
    }
}
function resolve_prev(list, index) {
    const self = tutorials[list[index]];
    if (index === 0) {
        if (self.parent) {
            self.prev = self.parent;
        }
    } else {
        self.prev = list[index-1];
    }
}

const top = Object.keys(top_level);
for (let i=0;i<top.length;i++) {
    tutorials[top[i]].siblings = top;
    tutorials[top[i]].sibling_idx = i;
    resolve_next(top, i);
    resolve_prev(top, i);
}

Object.keys(tutorials).forEach(tut_name => {
    const src_file = path.format({
        dir: src_path,
        name: tut_name,
        ext: '.md'
    });
    const dest_file = path.format({
        dir: out_path,
        name: tut_name,
        ext: '.md'
    });
    const in_file = fs.createReadStream(src_file);
    const out_file = fs.createWriteStream(dest_file, { autoClose: false });
    in_file.pipe(out_file, { end: false });
    in_file.on('end', () => {
        out_file.write('\n---\n');
        out_file.write('|||\n');
        out_file.write('|:-|-:|\n');
        const prev = tutorials[tut_name].prev ? `<<< {@tutorial ${tutorials[tut_name].prev}}` : '&nbsp;';
        const next = tutorials[tut_name].next ? `{@tutorial ${tutorials[tut_name].next}} >>>` : '&nbsp;';
        out_file.write(`|${prev}|${next}|\n`);
        out_file.close();
    });
});


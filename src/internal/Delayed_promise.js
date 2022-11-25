/******************************************************************************
 * Copyright 2010-2019 migenius pty ltd, Australia. All rights reserved.
 *****************************************************************************/

/// A Promise wrapper that exposes a promise and allows it be resolved or
/// rejected later
class Delayed_promise {
    constructor() {
        this._promise = new Promise((resolve, reject) => {
            this._resolve = resolve;
            this._reject = reject;
        });
    }

    get promise() {
        return this._promise;
    }

    get resolve() {
        return this._resolve;
    }

    get reject() {
        return this._reject;
    }
}

export default Delayed_promise;

(function(){var e=0;var a;var t=document.getElementById("source-code");if(t){var n=config.linenums;if(n){t=t.getElementsByTagName("ol")[0];a=Array.prototype.slice.apply(t.children);a=a.map(function(a){e++;a.id="line"+e})}else{t=t.getElementsByTagName("code")[0];a=t.innerHTML.split("\n");a=a.map(function(a){e++;return'<span id="line'+e+'"></span>'+a});t.innerHTML=a.join("\n")}}})();$(function(){var e=$(".navigation");var a=e.find(".list");var t=$(".search");$("#search").on("keyup",function(t){var n=this.value.trim();if(n){var s=new RegExp(n,"i");e.addClass("searching").removeClass("not-searching").find("li, .itemMembers").removeClass("match");e.find("li").each(function(e,a){var t=$(a);if(t.data("name")&&s.test(t.data("name"))){t.addClass("match");t.closest(".itemMembers").addClass("match");t.closest(".item").addClass("match")}})}else{e.removeClass("searching").addClass("not-searching").find(".item, .itemMembers").removeClass("match")}a.scrollTop(0)});$("#menuToggle").click(function(){a.toggleClass("show");t.toggleClass("show")});e.addClass("not-searching");var n=$(".page-title").data("filename").replace(/\.[a-z]+$/,"");var s=e.find('.item[data-name*="'+n+'"]:eq(0)');if(s.length){if(s.parents(".children").length){s.addClass("current");s.find("li.item").addClass("notCurrent");s=s.parents("ul.list>li.item")}s.remove().prependTo(a).addClass("current")}if(config.disqus){$(window).on("load",function(){var e=config.disqus;var a=document.createElement("script");a.type="text/javascript";a.async=true;a.src="http://"+e+".disqus.com/embed.js";(document.getElementsByTagName("head")[0]||document.getElementsByTagName("body")[0]).appendChild(a);var t=document.createElement("script");t.async=true;t.type="text/javascript";t.src="http://"+e+".disqus.com/count.js";document.getElementsByTagName("BODY")[0].appendChild(t)})}});
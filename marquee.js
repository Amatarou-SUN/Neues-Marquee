/**
 * Neues-Marquee exp-17
 * March 26, 2026 Version
 * 
 * @author yumezato-stt
 * @description The marquee polyfill for modern browser. 
 * 
 * Copyright (c) 2026 yumezato-stt
 * Released under the MIT license.
 * https://github.com/yumezato-stt/Neues-Marquee/blob/main/LICENSE
*/
class HTMLNeuesMarqueeElement extends HTMLElement {
    constructor () {
        super();
        //規定値設定
        this.behavior = "scroll";
        this.direction = "left";
        this.scrollamount = "6";
        this.scrolldelay = "85";
        this.loop = "-1";
        this.linear = false;
        this.truespeed = "";
        //変数
        this.marqueesize = null;
        this.marqueecontentsize = null;
        this.aftermarq_timeout = [];
        this.marqueeanimation = null;

        //マーキー内部DOM作成
        const shadowRoot = this.attachShadow({ mode: "open" });

        const style=document.createElement("style");
        style.textContent = `
            @property --container-width {
                syntax: "<number>";
                inherits: true;
                initial-value: 0;
            }
            @property --container-height {
                syntax: "<number>";
                inherits: true;
                initial-value: 0;
            }
            @property --content-width {
                syntax: "<number>";
                inherits: true;
                initial-value: 0;
            }
            @property --content-height {
                syntax: "<number>";
                inherits: true;
                initial-value: 0;
            }
            :host {
                position: relative;
                height: auto;
                overflow: hidden;
                display: inline-block;
                width: 100%;
            }
            .marquee_modernized {
                position: relative;
                height: auto;
                overflow: hidden;
                display: inline-block;
                width: 100%;
            }
            .marqueemodern_content {
                position: relative;
                display: block;
                inline-size: fit-content;
                animation-fill-mode: forwards;
                white-space: nowrap;
            }
            .marqueemodern_content_vertical {
                position: absolute !important;
                display: inline-block !important;
                inline-size: fit-content !important;
                block-size: fit-content !important;
                min-height: 1em;
            }
        `;
        
        shadowRoot.appendChild(style);
        let contentdiv = document.createElement("div");
        contentdiv.classList.add("marqueemodern_content");
        let contentslot = document.createElement("slot");
        contentdiv.appendChild(contentslot);
        shadowRoot.appendChild(contentdiv);
        this.shadowcontentdiv = contentdiv;
        this.resizeobserverconfig = {};
        this.resizeobserver = new ResizeObserver(this.marquee_resizeobservercallback);
        this.contentresizeobserver = new ResizeObserver(this.marquee_contentresizeobservercallback)
    }
    horizontal_vertical = (direction) => {
        switch(direction) {
            case "left":
                return [false, "horizontal"];
                break;
            case "right":
                return [true, "horizontal"];
                break;
            case "up":
                return [false, "vertical"];
                break;
            case "down":
                return [true, "vertical"];
                break;
        }
    }
    static get observedAttributes() {
      return ["behavior", "direction", "scrollamount", "scrolldelay", "loop", "width", "height", "bgcolor", "truespeed"];
    }
    keyframeset = {
        "scroll": {
            "horizontal": [
                {
                    transform: "translateX(calc(var(--container-width) * 1px))"
                },
                {
                    transform: "translateX(calc(0px - var(--content-width) * 1px))"
                }
            ],
            "vertical": [
                {
                    transform: "translateY(calc(var(--container-height) * 1px))"
                },
                {
                    transform: "translateY(calc(0px - var(--content-height) * 1px))"
                }
            ]
        },
        "alternate": {
            "horizontal": [
                {
                    transform: "translateX(calc(var(--container-width) * 1px - var(--content-width) * 1px))"
                },
                {
                    transform: "translateX(0px)"
                },
                {
                    transform: "translateX(calc(var(--container-width) * 1px - var(--content-width) * 1px))"
                }
            ],
            "vertical": [
                {
                    transform: "translateY(calc(var(--container-height) * 1px - var(--content-height) * 1px))"
                },
                {
                    transform: "translateY(0px)"
                },
                {
                    transform: "translateY(calc(var(--container-height) * 1px - var(--content-height) * 1px))"
                }
            ]
        },
        "slide": {
            "left": [
                {
                    transform: "translateX(calc(var(--container-width) * 1px))"
                },
                {
                    transform: "translateX(0px)"
                }
            ],
            "right": [
                {
                    transform: "translateX(calc(0px - var(--content-width) * 1px))"
                },
                {
                    transform: "translateX(calc(var(--container-width) * 1px - var(--content-width) * 1px))"
                }
            ]
        }
    };
    marquee_modern_calculation = (container_box, content_box) => {
        console.debug("[marquee_modern_calculation]", this); //Debug Message (-marqueejs)
        this.marqueesize = container_box;
        var additional_class = [];
        var scrollamount = Number(this.scrollamount);
        var scrolldelay = Number(this.scrolldelay);
        var direction = this.direction;
        var behavior = this.behavior;
        var loop = (this.loop != "-1")? this.loop : Infinity;

        var animation = undefined;
        //水平垂直 + 左下・反転 判定
        var horizontal_vertical = this.horizontal_vertical(direction);
        var rev = horizontal_vertical[0];
        var horver = horizontal_vertical[1];
        if (horver == "vertical") {
            additional_class.push("marqueemodern_content_vertical");
        }
        console.debug("[marquee_modern_calculation] !horizontal_vertical", horizontal_vertical); //Debug Message (-marqueejs)
        //duration計算
        var duration = 0;
        switch (behavior) {
            case "scroll":
                if (horver == "horizontal") {
                    duration = (container_box.width + content_box.width) / scrollamount * (scrolldelay);
                }
                else if (horver == "vertical") {
                    duration = (container_box.height + content_box.height) / scrollamount * (scrolldelay);
                }
            break;
            case "slide":
                loop = "1";
                if (horver == "horizontal") {
                    duration = (container_box.width) / scrollamount * (scrolldelay);
                }
                else if (horver == "vertical") {
                    duration = (container_box.height + content_box.height) / scrollamount * (scrolldelay);
                }
            break;
            case "alternate":
                if (horver == "horizontal") {
                    duration = (
                        (container_box.width / scrollamount * (scrolldelay))
                        - (content_box.width / scrollamount * (scrolldelay))
                    ) * 2;
                }
                else if (horver == "vertical") {
                    duration = (
                        (container_box.height / scrollamount * (scrolldelay))
                        - (content_box.height / scrollamount * (scrolldelay))
                    ) * 2;
                }
            break;
        }
        //スライド系統の対策
        if (behavior == "scroll" || behavior == "alternate") {
            animation = this.keyframeset[behavior][horver];
        }
        if (behavior == "slide") {
            animation = this.keyframeset[behavior][direction];
            rev = false;
        }

        //ステップ計算
        var timingfunction = this.linear? "linear" : "";
        if (!this.linear) {
            switch(behavior) {
                case "alternate":
                    timingfunction = `steps(calc(${duration / (scrolldelay)}), end)`
                    break;
                default:
                    timingfunction = `steps(calc(${duration / (scrolldelay)}), end)`
                    break;
            }
        }
        console.debug("[marquee_modern_calculation] done");  //Debug Message (-marqueejs)
        return {
            animation: animation,
            animationproperties: {
                duration: duration,
                easing: timingfunction,
                iterations: loop,
                direction: rev? "reverse" : "normal"
            },
            additional_class: additional_class
        };
    }
    marqueecontent_applySize(newtime = -1) {
        console.debug("[marqueecontent_applySize]", this, this.shadowcontentdiv);  //Debug Message (-marqueejs)
        this.marqueecontent_clearafterloop_timeout();
        var old_dur = this.marqueeanimation.effect.getTiming().duration;
        var now = this.marqueeanimation.currentTime % old_dur;
        var nowper = now / old_dur;
        var calculate = this.marquee_modern_calculation(this.marqueesize, this.marqueecontentsize);
        this.marqueeanimation.effect.updateTiming({duration: calculate.animationproperties.duration, easing: calculate.animationproperties.easing});
        this.marqueeanimation.currentTime = newtime == -1 ? calculate.animationproperties.duration * nowper : newtime;        
        this.marqueecontentsize = this.shadowcontentdiv.getBoundingClientRect();
        this.marqueecontent_setproperties();
    }
    marqueecontent_setproperties() {
        this.shadowcontentdiv.style.setProperty("--container-width", this.marqueesize.width);
        this.shadowcontentdiv.style.setProperty("--container-height", this.marqueesize.height);        
        this.shadowcontentdiv.style.setProperty("--content-width", this.marqueecontentsize.width);
        this.shadowcontentdiv.style.setProperty("--content-height", this.marqueecontentsize.height);        
    }
    marqueecontent_set() {
        console.debug("[marqueecontent_set]", this);  //Debug Message (-marqueejs)
        this.shadowcontentdiv.setAttribute("class", "");
        this.shadowcontentdiv.classList.add("marqueemodern_content");
        this.marqueesize = this.getBoundingClientRect();
        this.marqueecontentsize = this.shadowcontentdiv.getBoundingClientRect();
        this.marqueecontent_setproperties();
        var calculate = this.marquee_modern_calculation(this.marqueesize, this.marqueecontentsize);
        for (var a = 0; a < calculate.additional_class.length; a++) {
            this.shadowcontentdiv.classList.add(calculate.additional_class[a]);
        }        
        console.debug("[marqueecontent_set]", calculate);  //Debug Message (-marqueejs)
        this.marqueeanimation = this.shadowcontentdiv.animate(calculate.animation, calculate.animationproperties);
        console.debug("[marqueecontent_set] done"); //Debug Message (-marqueejs)
    }
    connectedCallback() {
        this.marqueecontent_set();
        console.debug("[marquee/connectedCallback]", this);
        this.resizeobserver.observe(this, this.resizeobserverconfig);
        this.contentresizeobserver.observe(this.shadowcontentdiv, this.resizeobserverconfig);
        console.debug("[marquee/connectedCallback] Observer Started", this, this.mutationobserver, this.res);
    }
    disconnectedCallback() {
        this.mutationobserver.disconnect();
        this.resizeobserver.disconnect();
    }
    attributeChangedCallback(name, oldValue, newValue) {
        switch(name) {
            case "behavior":
                this.behavior = newValue;
                this.marqueecontent_set();
                break;
            case "direction":
                this.direction = newValue;
                this.marqueecontent_set();
                break;
            case "scrollamount":
                this.scrollamount = newValue;
                this.marqueecontent_applySize();
                break;
            case "scrolldelay":
                this.scrolldelay = newValue;
                this.marqueecontent_applySize();
                break;
            case "loop":
                this.loop = newValue;
                this.marqueecontent_set();
                break;
            case "width":
                if (isNaN(newValue))
                    this.style.width = newValue;
                else
                    this.style.width = newValue + "px";
                this.marqueecontent_applySize();
                break;
            case "height":
                if (isNaN(newValue))
                    this.style.height = newValue;
                else
                    this.style.height = newValue + "px";
                this.marqueecontent_applySize();
                break;
            case "bgcolor":
                this.style.backgroundColor = newValue;
                break;
        }
        console.debug(`[attributeChangedCallback] name:${name}, old:${oldValue}, new:${newValue}`);  //Debug Message (-marqueejs)
    }
    marqueecontent_clearafterloop_timeout() {
        console.debug("[marqueecontent_clear_afterloop_timeout] Before Clear", this.aftermarq_timeout);  //Debug Message (-marqueejs)
        for (let i = 0; i < this.aftermarq_timeout.length; i++) {            
            clearTimeout(this.aftermarq_timeout[i]);
            this.aftermarq_timeout[i] = -1;
        }
        console.debug("[marqueecontent_clear_afterloop_timeout] After Clear", this.aftermarq_timeout);  //Debug Message (-marqueejs)
        this.aftermarq_timeout.splice(0);
    }
    marqueecontent_applySize_afterloop() {
        console.debug("[marqueecontent_applySize_afterloop]", this);  //Debug Message (-marqueejs)
        this.marqueecontent_clearafterloop_timeout();
        var duration = this.marqueeanimation.effect.getTiming().duration;
        var now = this.marqueeanimation.currentTime % duration;
        console.debug("[marqueecontent_applySize_afterloop] done", duration - now);  //Debug Message (-marqueejs)
        var timeout = setTimeout(() => {
            console.debug("[marqueecontent_applySize_afterloop] delayed start", this);  //Debug Message (-marqueejs)
            this.marqueecontentsize = this.shadowcontentdiv.getBoundingClientRect();
            this.marqueecontent_applySize();
            console.debug("[marqueecontent_applySize_afterloop] delayed end", this);  //Debug Message (-marqueejs)
        }, duration - now);
        this.aftermarq_timeout.push(timeout);
        console.debug("[marqueecontent_applySize_afterloop] done", this);  //Debug Message (-marqueejs)
    }
    marqueecontent_applySize_scrolllong(horizontal_vertical) {
        console.debug("[marqueecontent_applySize_p2]", this); //Debug Message (-marqueejs)
        var duration = this.marqueeanimation.effect.getTiming().duration;
        var now = this.marqueeanimation.currentTime % duration;
        var calculate = this.marquee_modern_calculation(this.getBoundingClientRect(), this.shadowcontentdiv.getBoundingClientRect());

        var old_msw = this.marqueesize.width;
        var old_msh = this.marqueesize.height;
        var old_mcw = this.marqueecontentsize.width;
        var old_mch = this.marqueecontentsize.height;
        console.debug("[marqueecontent_applySize_p2] !calc <old ms/mc>", old_msw, old_msh, old_mcw, old_mch); //Debug Message (-marqueejs)
        var new_msw = this.getBoundingClientRect().width;
        var new_msh = this.getBoundingClientRect().height;
        var new_mcw = this.shadowcontentdiv.getBoundingClientRect().width;
        var new_mch = this.shadowcontentdiv.getBoundingClientRect().height;
        console.debug("[marqueecontent_applySize_p2] !calc <new ms/mc>", new_msw, new_msh, new_mcw, new_mch); //Debug Message (-marqueejs)
        var nowdiffx = old_msw - (old_msw + old_mcw) * (now / duration);
        var newdiffx = new_msw - (new_msw + new_mcw) * (now / calculate.animationproperties.duration);
        var nowdiffy = old_msh - (old_msh + old_mch) * (now / duration);
        var newdiffy = new_msh - (new_msh + new_mch) * (now / calculate.animationproperties.duration);
        var newtimeh = newdiffx / nowdiffx * now;
        var newtimev = newdiffy / nowdiffy * now;
        console.debug("[marqueecontent_applySize_p2] !calc[h", nowdiffx, newdiffx, newtimeh); //Debug Message (-marqueejs)
        console.debug("[marqueecontent_applySize_p2] !calc[v", nowdiffy, newdiffy, newtimev); //Debug Message (-marqueejs)
        this.marqueecontent_applySize(horizontal_vertical == "horizontal"? newtimeh : newtimev);
        console.debug("[marqueecontent_applySize_p2] done", this); //Debug Message (-marqueejs)
    }
    marquee_applySize_ContentChanged = () => {
        var horizontal_vertical = this.horizontal_vertical(this.direction);
        if (this.behavior == "scroll") {
            console.debug("[marquee_mutationobservercallback] scroll / alternate", this); //Debug Message (-marqueejs)
            if (horizontal_vertical[1] == "horizontal" && this.shadowcontentdiv.getBoundingClientRect().width <= this.marqueecontentsize.width)
            {
                console.debug("[marquee_mutationobservercallback] horizontal, shorter", this); //Debug Message (-marqueejs)
                this.marqueecontent_applySize_afterloop();
                return;
            }
            else if (horizontal_vertical[1] == "vertical" && this.shadowcontentdiv.getBoundingClientRect().height <= this.marqueecontentsize.height)
            {
                console.debug("[marquee_mutationobservercallback] vertical, shorter", this); //Debug Message (-marqueejs)
                this.marqueecontent_applySize_afterloop();
                return;
            }
            else if (horizontal_vertical[1] == "horizontal" && this.shadowcontentdiv.getBoundingClientRect().width > this.marqueecontentsize.width)
            {
                console.debug("[marquee_mutationobservercallback] horizontal, longer", this); //Debug Message (-marqueejs)
                this.marqueecontent_applySize_scrolllong(horizontal_vertical[1]);
                return;
            }
            else if (horizontal_vertical[1] == "vertical" && this.shadowcontentdiv.getBoundingClientRect().height > this.marqueecontentsize.height)
            {
                console.debug("[marquee_mutationobservercallback] vertical, longer", this); //Debug Message (-marqueejs)
                this.marqueecontent_applySize_scrolllong(horizontal_vertical[1]);
                return;
            }
            else {
                console.warn("[marquee_mutationobservercallback] ! No Match", this); //Debug Message (-marqueejs)
            }            
        }
    }
    marquee_contentresizeobservercallback = () => {
        this.marquee_applySize_ContentChanged();
    }
    marquee_resizeobservercallback = (entries) => {
        console.debug("[marqueecontent_resizeobservercallback]", this); //Debug Message (-marqueejs)
        console.debug("[marqueecontent_resizeobservercallback]", entries); //Debug Message (-marqueejs)
        entries.forEach((value) => {
            console.debug(value);
        })
        this.marqueesize = this.getBoundingClientRect();
        this.marqueecontent_applySize();
        console.debug("[marqueecontent_resizeobservercallback] end", this); //Debug Message (-marqueejs)
    }
    marqueecontent_hardresize() {
        console.debug("[marqueecontent_applySize_hardresize]", this); //Debug Message (-marqueejs)
        this.marqueecontentsize = this.shadowcontentdiv.getBoundingClientRect();
        this.marqueecontent_applySize();
        console.debug("[marqueecontent_applySize_hardresize] end", this); //Debug Message (-marqueejs)
    }
    start() {
        this.marqueeanimation.play();
    }
    stop() {
        this.marqueeanimation.pause();
    }
}
customElements.define("neues-marquee", HTMLNeuesMarqueeElement);

/**
 * @author JuthaDDA
 * @see [element.tagName は readonly なので，
 *     HTML 要素のタグ名を変更する関数を作った - Qiita](
 *     https://qiita.com/juthaDDA/items/974fda70945750e68120)
 */
const replaceTagName = ( target, tagName ) => {
	if ( ! target.parentNode ) { return target; }

	const replacement = document.createElement( tagName );
	Array.from( target.attributes ).forEach( ( attribute ) => {
		const { nodeName, nodeValue } = attribute;
		if ( nodeValue ) {
			replacement.setAttribute( nodeName, nodeValue );
		}
	} );
	Array.from( target.childNodes ).forEach( ( node ) => {
		replacement.appendChild( node );
	} ); // For some reason, only textNodes are appended
		// without converting childNodes to Array.
	target.parentNode.replaceChild( replacement, target );
	return replacement;
};

const replacement = () => {
    console.debug("[marquee.js] replacement"); //Debug Message (-marqueejs)
    let c = 0;
    var marquees = document.querySelectorAll("marquee");
    for (var i = 0; i < marquees.length; i++) {
        replaceTagName(marquees[i], "neues-marquee");
        c++
    }
    console.debug(`[marquee.js] replacement end. ${c} element affect.`); //Debug Message (-marqueejs)
}
const sizechange = () => {
    console.debug("[marquee.js] sizechange"); //Debug Message (-marqueejs)
    let c;
    var marquees = document.querySelectorAll("neues-marquee");
    for (var i = 0; i < marquees.length; i++) {
        marquees[i].marqueecontent_hardresize();
        c++
    }
    console.debug(`[marquee.js] sizechange end. ${c} element affect.`); //Debug Message (-marqueejs)
}

window.addEventListener("DOMContentLoaded", replacement);
window.addEventListener("load", () => {
    const mutationobserverconfig = {attributes: false, childList: true, subtree: true};
    const mutationobserver = new MutationObserver(marqueeadd_mutationobservercallback.bind(this));
    mutationobserver.observe(document, mutationobserverconfig);
});
function marqueeadd_mutationobservercallback(mutationList, observer) {
    replacement();
}
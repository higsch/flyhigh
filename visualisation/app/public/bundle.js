
(function(l, i, v, e) { v = l.createElement(i); v.async = 1; v.src = '//' + (location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; e = l.getElementsByTagName(i)[0]; e.parentNode.insertBefore(v, e)})(document, 'script');
var app = (function () {
    'use strict';

    function noop() { }
    const identity = x => x;
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    function is_promise(value) {
        return value && typeof value === 'object' && typeof value.then === 'function';
    }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }

    const is_client = typeof window !== 'undefined';
    let now = is_client
        ? () => window.performance.now()
        : () => Date.now();
    let raf = is_client ? cb => requestAnimationFrame(cb) : noop;

    const tasks = new Set();
    let running = false;
    function run_tasks() {
        tasks.forEach(task => {
            if (!task[0](now())) {
                tasks.delete(task);
                task[1]();
            }
        });
        running = tasks.size > 0;
        if (running)
            raf(run_tasks);
    }
    function loop(fn) {
        let task;
        if (!running) {
            running = true;
            raf(run_tasks);
        }
        return {
            promise: new Promise(fulfil => {
                tasks.add(task = [fn, fulfil]);
            }),
            abort() {
                tasks.delete(task);
            }
        };
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function svg_element(name) {
        return document.createElementNS('http://www.w3.org/2000/svg', name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function stop_propagation(fn) {
        return function (event) {
            event.stopPropagation();
            // @ts-ignore
            return fn.call(this, event);
        };
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_data(text, data) {
        data = '' + data;
        if (text.data !== data)
            text.data = data;
    }
    function set_style(node, key, value) {
        node.style.setProperty(key, value);
    }
    function add_resize_listener(element, fn) {
        if (getComputedStyle(element).position === 'static') {
            element.style.position = 'relative';
        }
        const object = document.createElement('object');
        object.setAttribute('style', 'display: block; position: absolute; top: 0; left: 0; height: 100%; width: 100%; overflow: hidden; pointer-events: none; z-index: -1;');
        object.type = 'text/html';
        object.tabIndex = -1;
        let win;
        object.onload = () => {
            win = object.contentDocument.defaultView;
            win.addEventListener('resize', fn);
        };
        if (/Trident/.test(navigator.userAgent)) {
            element.appendChild(object);
            object.data = 'about:blank';
        }
        else {
            object.data = 'about:blank';
            element.appendChild(object);
        }
        return {
            cancel: () => {
                win && win.removeEventListener && win.removeEventListener('resize', fn);
                element.removeChild(object);
            }
        };
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }
    class HtmlTag {
        constructor(html, anchor = null) {
            this.e = element('div');
            this.a = anchor;
            this.u(html);
        }
        m(target, anchor = null) {
            for (let i = 0; i < this.n.length; i += 1) {
                insert(target, this.n[i], anchor);
            }
            this.t = target;
        }
        u(html) {
            this.e.innerHTML = html;
            this.n = Array.from(this.e.childNodes);
        }
        p(html) {
            this.d();
            this.u(html);
            this.m(this.t, this.a);
        }
        d() {
            this.n.forEach(detach);
        }
    }

    let stylesheet;
    let active = 0;
    let current_rules = {};
    // https://github.com/darkskyapp/string-hash/blob/master/index.js
    function hash(str) {
        let hash = 5381;
        let i = str.length;
        while (i--)
            hash = ((hash << 5) - hash) ^ str.charCodeAt(i);
        return hash >>> 0;
    }
    function create_rule(node, a, b, duration, delay, ease, fn, uid = 0) {
        const step = 16.666 / duration;
        let keyframes = '{\n';
        for (let p = 0; p <= 1; p += step) {
            const t = a + (b - a) * ease(p);
            keyframes += p * 100 + `%{${fn(t, 1 - t)}}\n`;
        }
        const rule = keyframes + `100% {${fn(b, 1 - b)}}\n}`;
        const name = `__svelte_${hash(rule)}_${uid}`;
        if (!current_rules[name]) {
            if (!stylesheet) {
                const style = element('style');
                document.head.appendChild(style);
                stylesheet = style.sheet;
            }
            current_rules[name] = true;
            stylesheet.insertRule(`@keyframes ${name} ${rule}`, stylesheet.cssRules.length);
        }
        const animation = node.style.animation || '';
        node.style.animation = `${animation ? `${animation}, ` : ``}${name} ${duration}ms linear ${delay}ms 1 both`;
        active += 1;
        return name;
    }
    function delete_rule(node, name) {
        node.style.animation = (node.style.animation || '')
            .split(', ')
            .filter(name
            ? anim => anim.indexOf(name) < 0 // remove specific animation
            : anim => anim.indexOf('__svelte') === -1 // remove all Svelte animations
        )
            .join(', ');
        if (name && !--active)
            clear_rules();
    }
    function clear_rules() {
        raf(() => {
            if (active)
                return;
            let i = stylesheet.cssRules.length;
            while (i--)
                stylesheet.deleteRule(i);
            current_rules = {};
        });
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error(`Function called outside component initialization`);
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }
    function createEventDispatcher() {
        const component = current_component;
        return (type, detail) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail);
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
            }
        };
    }
    // TODO figure out if we still want to support
    // shorthand events, or if we want to implement
    // a real bubbling mechanism
    function bubble(component, event) {
        const callbacks = component.$$.callbacks[event.type];
        if (callbacks) {
            callbacks.slice().forEach(fn => fn(event));
        }
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    function flush() {
        const seen_callbacks = new Set();
        do {
            // first, call beforeUpdate functions
            // and update components
            while (dirty_components.length) {
                const component = dirty_components.shift();
                set_current_component(component);
                update(component.$$);
            }
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    callback();
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
    }
    function update($$) {
        if ($$.fragment) {
            $$.update($$.dirty);
            run_all($$.before_update);
            $$.fragment.p($$.dirty, $$.ctx);
            $$.dirty = null;
            $$.after_update.forEach(add_render_callback);
        }
    }

    let promise;
    function wait() {
        if (!promise) {
            promise = Promise.resolve();
            promise.then(() => {
                promise = null;
            });
        }
        return promise;
    }
    function dispatch(node, direction, kind) {
        node.dispatchEvent(custom_event(`${direction ? 'intro' : 'outro'}${kind}`));
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }
    function create_bidirectional_transition(node, fn, params, intro) {
        let config = fn(node, params);
        let t = intro ? 0 : 1;
        let running_program = null;
        let pending_program = null;
        let animation_name = null;
        function clear_animation() {
            if (animation_name)
                delete_rule(node, animation_name);
        }
        function init(program, duration) {
            const d = program.b - t;
            duration *= Math.abs(d);
            return {
                a: t,
                b: program.b,
                d,
                duration,
                start: program.start,
                end: program.start + duration,
                group: program.group
            };
        }
        function go(b) {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config;
            const program = {
                start: now() + delay,
                b
            };
            if (!b) {
                // @ts-ignore todo: improve typings
                program.group = outros;
                outros.r += 1;
            }
            if (running_program) {
                pending_program = program;
            }
            else {
                // if this is an intro, and there's a delay, we need to do
                // an initial tick and/or apply CSS animation immediately
                if (css) {
                    clear_animation();
                    animation_name = create_rule(node, t, b, duration, delay, easing, css);
                }
                if (b)
                    tick(0, 1);
                running_program = init(program, duration);
                add_render_callback(() => dispatch(node, b, 'start'));
                loop(now => {
                    if (pending_program && now > pending_program.start) {
                        running_program = init(pending_program, duration);
                        pending_program = null;
                        dispatch(node, running_program.b, 'start');
                        if (css) {
                            clear_animation();
                            animation_name = create_rule(node, t, running_program.b, running_program.duration, 0, easing, config.css);
                        }
                    }
                    if (running_program) {
                        if (now >= running_program.end) {
                            tick(t = running_program.b, 1 - t);
                            dispatch(node, running_program.b, 'end');
                            if (!pending_program) {
                                // we're done
                                if (running_program.b) {
                                    // intro — we can tidy up immediately
                                    clear_animation();
                                }
                                else {
                                    // outro — needs to be coordinated
                                    if (!--running_program.group.r)
                                        run_all(running_program.group.c);
                                }
                            }
                            running_program = null;
                        }
                        else if (now >= running_program.start) {
                            const p = now - running_program.start;
                            t = running_program.a + running_program.d * easing(p / running_program.duration);
                            tick(t, 1 - t);
                        }
                    }
                    return !!(running_program || pending_program);
                });
            }
        }
        return {
            run(b) {
                if (is_function(config)) {
                    wait().then(() => {
                        // @ts-ignore
                        config = config();
                        go(b);
                    });
                }
                else {
                    go(b);
                }
            },
            end() {
                clear_animation();
                running_program = pending_program = null;
            }
        };
    }

    function handle_promise(promise, info) {
        const token = info.token = {};
        function update(type, index, key, value) {
            if (info.token !== token)
                return;
            info.resolved = key && { [key]: value };
            const child_ctx = assign(assign({}, info.ctx), info.resolved);
            const block = type && (info.current = type)(child_ctx);
            if (info.block) {
                if (info.blocks) {
                    info.blocks.forEach((block, i) => {
                        if (i !== index && block) {
                            group_outros();
                            transition_out(block, 1, 1, () => {
                                info.blocks[i] = null;
                            });
                            check_outros();
                        }
                    });
                }
                else {
                    info.block.d(1);
                }
                block.c();
                transition_in(block, 1);
                block.m(info.mount(), info.anchor);
                flush();
            }
            info.block = block;
            if (info.blocks)
                info.blocks[index] = block;
        }
        if (is_promise(promise)) {
            promise.then(value => {
                update(info.then, 1, info.value, value);
            }, error => {
                update(info.catch, 2, info.error, error);
            });
            // if we previously had a then/catch block, destroy it
            if (info.current !== info.pending) {
                update(info.pending, 0);
                return true;
            }
        }
        else {
            if (info.current !== info.then) {
                update(info.then, 1, info.value, promise);
                return true;
            }
            info.resolved = { [info.value]: promise };
        }
    }

    const globals = (typeof window !== 'undefined' ? window : global);

    function destroy_block(block, lookup) {
        block.d(1);
        lookup.delete(block.key);
    }
    function update_keyed_each(old_blocks, changed, get_key, dynamic, ctx, list, lookup, node, destroy, create_each_block, next, get_context) {
        let o = old_blocks.length;
        let n = list.length;
        let i = o;
        const old_indexes = {};
        while (i--)
            old_indexes[old_blocks[i].key] = i;
        const new_blocks = [];
        const new_lookup = new Map();
        const deltas = new Map();
        i = n;
        while (i--) {
            const child_ctx = get_context(ctx, list, i);
            const key = get_key(child_ctx);
            let block = lookup.get(key);
            if (!block) {
                block = create_each_block(key, child_ctx);
                block.c();
            }
            else if (dynamic) {
                block.p(changed, child_ctx);
            }
            new_lookup.set(key, new_blocks[i] = block);
            if (key in old_indexes)
                deltas.set(key, Math.abs(i - old_indexes[key]));
        }
        const will_move = new Set();
        const did_move = new Set();
        function insert(block) {
            transition_in(block, 1);
            block.m(node, next);
            lookup.set(block.key, block);
            next = block.first;
            n--;
        }
        while (o && n) {
            const new_block = new_blocks[n - 1];
            const old_block = old_blocks[o - 1];
            const new_key = new_block.key;
            const old_key = old_block.key;
            if (new_block === old_block) {
                // do nothing
                next = new_block.first;
                o--;
                n--;
            }
            else if (!new_lookup.has(old_key)) {
                // remove old block
                destroy(old_block, lookup);
                o--;
            }
            else if (!lookup.has(new_key) || will_move.has(new_key)) {
                insert(new_block);
            }
            else if (did_move.has(old_key)) {
                o--;
            }
            else if (deltas.get(new_key) > deltas.get(old_key)) {
                did_move.add(new_key);
                insert(new_block);
            }
            else {
                will_move.add(old_key);
                o--;
            }
        }
        while (o--) {
            const old_block = old_blocks[o];
            if (!new_lookup.has(old_block.key))
                destroy(old_block, lookup);
        }
        while (n)
            insert(new_blocks[n - 1]);
        return new_blocks;
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        if (component.$$.fragment) {
            run_all(component.$$.on_destroy);
            component.$$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            component.$$.on_destroy = component.$$.fragment = null;
            component.$$.ctx = {};
        }
    }
    function make_dirty(component, key) {
        if (!component.$$.dirty) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty = blank_object();
        }
        component.$$.dirty[key] = true;
    }
    function init(component, options, instance, create_fragment, not_equal, prop_names) {
        const parent_component = current_component;
        set_current_component(component);
        const props = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props: prop_names,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty: null
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, props, (key, value) => {
                if ($$.ctx && not_equal($$.ctx[key], $$.ctx[key] = value)) {
                    if ($$.bound[key])
                        $$.bound[key](value);
                    if (ready)
                        make_dirty(component, key);
                }
            })
            : props;
        $$.update();
        ready = true;
        run_all($$.before_update);
        $$.fragment = create_fragment($$.ctx);
        if (options.target) {
            if (options.hydrate) {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment.l(children(options.target));
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set() {
            // overridden by instance, if it has props
        }
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
    }

    /* src/Legend/Legend.svelte generated by Svelte v3.7.0 */

    const file = "src/Legend/Legend.svelte";

    function create_fragment(ctx) {
    	var div, h4, t1, p, div_resize_listener, t3, svg, g0, line0, text0, t4, text0_transform_value, g0_transform_value, g1, line1, text1, t5, text1_transform_value, g1_transform_value, g2, line2, text2, t6, text2_transform_value, g2_transform_value;

    	return {
    		c: function create() {
    			div = element("div");
    			h4 = element("h4");
    			h4.textContent = "How to read this chart";
    			t1 = space();
    			p = element("p");
    			p.textContent = "Each line is showing prices for a flight from Stockholm to Frankfurt for one passenger – collected from\n    30 days before departure until the day before takeoff.\n    The color at each time point tells whether the price is above or below the final price.";
    			t3 = space();
    			svg = svg_element("svg");
    			g0 = svg_element("g");
    			line0 = svg_element("line");
    			text0 = svg_element("text");
    			t4 = text("below");
    			g1 = svg_element("g");
    			line1 = svg_element("line");
    			text1 = svg_element("text");
    			t5 = text("above");
    			g2 = svg_element("g");
    			line2 = svg_element("line");
    			text2 = svg_element("text");
    			t6 = text("final price");
    			attr(h4, "class", "svelte-cyhztp");
    			add_location(h4, file, 11, 2, 294);
    			attr(p, "class", "mt");
    			add_location(p, file, 12, 2, 328);
    			add_render_callback(() => ctx.div_resize_handler.call(div));
    			attr(div, "class", "text svelte-cyhztp");
    			add_location(div, file, 10, 0, 221);
    			attr(line0, "class", "low svelte-cyhztp");
    			attr(line0, "x1", "0");
    			attr(line0, "y1", ctx.lineYOffset);
    			attr(line0, "x2", ctx.lineWidth);
    			attr(line0, "y2", ctx.lineYOffset);
    			add_location(line0, file, 20, 4, 717);
    			attr(text0, "transform", text0_transform_value = "translate(" + ctx.lineWidth / 2 + " " + ctx.textYOffset + ")");
    			attr(text0, "class", "svelte-cyhztp");
    			add_location(text0, file, 21, 4, 803);
    			attr(g0, "class", "first");
    			attr(g0, "transform", g0_transform_value = "translate(" + margin / 2 + " 0)");
    			add_location(g0, file, 19, 2, 657);
    			attr(line1, "class", "high svelte-cyhztp");
    			attr(line1, "x1", "0");
    			attr(line1, "y1", ctx.lineYOffset);
    			attr(line1, "x2", ctx.lineWidth);
    			attr(line1, "y2", ctx.lineYOffset);
    			add_location(line1, file, 24, 4, 959);
    			attr(text1, "transform", text1_transform_value = "translate(" + ctx.lineWidth / 2 + " " + ctx.textYOffset + ")");
    			attr(text1, "class", "svelte-cyhztp");
    			add_location(text1, file, 25, 4, 1046);
    			attr(g1, "class", "second");
    			attr(g1, "transform", g1_transform_value = "translate(" + (1.5 * margin + ctx.lineWidth) + " 0)");
    			add_location(g1, file, 23, 2, 884);
    			attr(line2, "class", "final svelte-cyhztp");
    			attr(line2, "x1", "0");
    			attr(line2, "y1", ctx.lineYOffset);
    			attr(line2, "x2", ctx.lineWidth);
    			attr(line2, "y2", ctx.lineYOffset);
    			add_location(line2, file, 28, 4, 1205);
    			attr(text2, "transform", text2_transform_value = "translate(" + ctx.lineWidth / 2 + " " + ctx.textYOffset + ")");
    			attr(text2, "class", "svelte-cyhztp");
    			add_location(text2, file, 29, 4, 1293);
    			attr(g2, "class", "third");
    			attr(g2, "transform", g2_transform_value = "translate(" + (2.5 * margin + 2 * ctx.lineWidth) + " 0)");
    			add_location(g2, file, 27, 2, 1127);
    			attr(svg, "width", ctx.width);
    			attr(svg, "height", ctx.svgHeight);
    			attr(svg, "class", "svelte-cyhztp");
    			add_location(svg, file, 18, 0, 616);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, div, anchor);
    			append(div, h4);
    			append(div, t1);
    			append(div, p);
    			div_resize_listener = add_resize_listener(div, ctx.div_resize_handler.bind(div));
    			insert(target, t3, anchor);
    			insert(target, svg, anchor);
    			append(svg, g0);
    			append(g0, line0);
    			append(g0, text0);
    			append(text0, t4);
    			append(svg, g1);
    			append(g1, line1);
    			append(g1, text1);
    			append(text1, t5);
    			append(svg, g2);
    			append(g2, line2);
    			append(g2, text2);
    			append(text2, t6);
    		},

    		p: function update(changed, ctx) {
    			if (changed.lineYOffset) {
    				attr(line0, "y1", ctx.lineYOffset);
    			}

    			if (changed.lineWidth) {
    				attr(line0, "x2", ctx.lineWidth);
    			}

    			if (changed.lineYOffset) {
    				attr(line0, "y2", ctx.lineYOffset);
    			}

    			if ((changed.lineWidth || changed.textYOffset) && text0_transform_value !== (text0_transform_value = "translate(" + ctx.lineWidth / 2 + " " + ctx.textYOffset + ")")) {
    				attr(text0, "transform", text0_transform_value);
    			}

    			if (changed.lineYOffset) {
    				attr(line1, "y1", ctx.lineYOffset);
    			}

    			if (changed.lineWidth) {
    				attr(line1, "x2", ctx.lineWidth);
    			}

    			if (changed.lineYOffset) {
    				attr(line1, "y2", ctx.lineYOffset);
    			}

    			if ((changed.lineWidth || changed.textYOffset) && text1_transform_value !== (text1_transform_value = "translate(" + ctx.lineWidth / 2 + " " + ctx.textYOffset + ")")) {
    				attr(text1, "transform", text1_transform_value);
    			}

    			if ((changed.lineWidth) && g1_transform_value !== (g1_transform_value = "translate(" + (1.5 * margin + ctx.lineWidth) + " 0)")) {
    				attr(g1, "transform", g1_transform_value);
    			}

    			if (changed.lineYOffset) {
    				attr(line2, "y1", ctx.lineYOffset);
    			}

    			if (changed.lineWidth) {
    				attr(line2, "x2", ctx.lineWidth);
    			}

    			if (changed.lineYOffset) {
    				attr(line2, "y2", ctx.lineYOffset);
    			}

    			if ((changed.lineWidth || changed.textYOffset) && text2_transform_value !== (text2_transform_value = "translate(" + ctx.lineWidth / 2 + " " + ctx.textYOffset + ")")) {
    				attr(text2, "transform", text2_transform_value);
    			}

    			if ((changed.lineWidth) && g2_transform_value !== (g2_transform_value = "translate(" + (2.5 * margin + 2 * ctx.lineWidth) + " 0)")) {
    				attr(g2, "transform", g2_transform_value);
    			}

    			if (changed.width) {
    				attr(svg, "width", ctx.width);
    			}

    			if (changed.svgHeight) {
    				attr(svg, "height", ctx.svgHeight);
    			}
    		},

    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(div);
    			}

    			div_resize_listener.cancel();

    			if (detaching) {
    				detach(t3);
    				detach(svg);
    			}
    		}
    	};
    }

    const margin = 15;

    function instance($$self, $$props, $$invalidate) {
    	
      let width, height;

    	function div_resize_handler() {
    		width = this.clientWidth;
    		height = this.clientHeight;
    		$$invalidate('width', width);
    		$$invalidate('height', height);
    	}

    	let lineWidth, svgHeight, lineYOffset, textYOffset;

    	$$self.$$.update = ($$dirty = { width: 1, height: 1, svgHeight: 1 }) => {
    		if ($$dirty.width) { $$invalidate('lineWidth', lineWidth = ((width || 0) - margin * 3) / 3); }
    		if ($$dirty.height) { $$invalidate('svgHeight', svgHeight = (height || 0) / 2); }
    		if ($$dirty.svgHeight) { $$invalidate('lineYOffset', lineYOffset = svgHeight / 1.5); }
    		if ($$dirty.svgHeight) { $$invalidate('textYOffset', textYOffset = svgHeight / 2.5); }
    	};

    	return {
    		width,
    		height,
    		lineWidth,
    		svgHeight,
    		lineYOffset,
    		textYOffset,
    		div_resize_handler
    	};
    }

    class Legend extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, []);
    	}
    }

    function ascending(a, b) {
      return a < b ? -1 : a > b ? 1 : a >= b ? 0 : NaN;
    }

    function bisector(compare) {
      if (compare.length === 1) compare = ascendingComparator(compare);
      return {
        left: function(a, x, lo, hi) {
          if (lo == null) lo = 0;
          if (hi == null) hi = a.length;
          while (lo < hi) {
            var mid = lo + hi >>> 1;
            if (compare(a[mid], x) < 0) lo = mid + 1;
            else hi = mid;
          }
          return lo;
        },
        right: function(a, x, lo, hi) {
          if (lo == null) lo = 0;
          if (hi == null) hi = a.length;
          while (lo < hi) {
            var mid = lo + hi >>> 1;
            if (compare(a[mid], x) > 0) hi = mid;
            else lo = mid + 1;
          }
          return lo;
        }
      };
    }

    function ascendingComparator(f) {
      return function(d, x) {
        return ascending(f(d), x);
      };
    }

    var ascendingBisect = bisector(ascending);
    var bisectRight = ascendingBisect.right;

    function extent(values, valueof) {
      var n = values.length,
          i = -1,
          value,
          min,
          max;

      if (valueof == null) {
        while (++i < n) { // Find the first comparable value.
          if ((value = values[i]) != null && value >= value) {
            min = max = value;
            while (++i < n) { // Compare the remaining values.
              if ((value = values[i]) != null) {
                if (min > value) min = value;
                if (max < value) max = value;
              }
            }
          }
        }
      }

      else {
        while (++i < n) { // Find the first comparable value.
          if ((value = valueof(values[i], i, values)) != null && value >= value) {
            min = max = value;
            while (++i < n) { // Compare the remaining values.
              if ((value = valueof(values[i], i, values)) != null) {
                if (min > value) min = value;
                if (max < value) max = value;
              }
            }
          }
        }
      }

      return [min, max];
    }

    function d3range(start, stop, step) {
      start = +start, stop = +stop, step = (n = arguments.length) < 2 ? (stop = start, start = 0, 1) : n < 3 ? 1 : +step;

      var i = -1,
          n = Math.max(0, Math.ceil((stop - start) / step)) | 0,
          range = new Array(n);

      while (++i < n) {
        range[i] = start + i * step;
      }

      return range;
    }

    var e10 = Math.sqrt(50),
        e5 = Math.sqrt(10),
        e2 = Math.sqrt(2);

    function ticks(start, stop, count) {
      var reverse,
          i = -1,
          n,
          ticks,
          step;

      stop = +stop, start = +start, count = +count;
      if (start === stop && count > 0) return [start];
      if (reverse = stop < start) n = start, start = stop, stop = n;
      if ((step = tickIncrement(start, stop, count)) === 0 || !isFinite(step)) return [];

      if (step > 0) {
        start = Math.ceil(start / step);
        stop = Math.floor(stop / step);
        ticks = new Array(n = Math.ceil(stop - start + 1));
        while (++i < n) ticks[i] = (start + i) * step;
      } else {
        start = Math.floor(start * step);
        stop = Math.ceil(stop * step);
        ticks = new Array(n = Math.ceil(start - stop + 1));
        while (++i < n) ticks[i] = (start - i) / step;
      }

      if (reverse) ticks.reverse();

      return ticks;
    }

    function tickIncrement(start, stop, count) {
      var step = (stop - start) / Math.max(0, count),
          power = Math.floor(Math.log(step) / Math.LN10),
          error = step / Math.pow(10, power);
      return power >= 0
          ? (error >= e10 ? 10 : error >= e5 ? 5 : error >= e2 ? 2 : 1) * Math.pow(10, power)
          : -Math.pow(10, -power) / (error >= e10 ? 10 : error >= e5 ? 5 : error >= e2 ? 2 : 1);
    }

    function tickStep(start, stop, count) {
      var step0 = Math.abs(stop - start) / Math.max(0, count),
          step1 = Math.pow(10, Math.floor(Math.log(step0) / Math.LN10)),
          error = step0 / step1;
      if (error >= e10) step1 *= 10;
      else if (error >= e5) step1 *= 5;
      else if (error >= e2) step1 *= 2;
      return stop < start ? -step1 : step1;
    }

    function d3max(values, valueof) {
      var n = values.length,
          i = -1,
          value,
          max;

      if (valueof == null) {
        while (++i < n) { // Find the first comparable value.
          if ((value = values[i]) != null && value >= value) {
            max = value;
            while (++i < n) { // Compare the remaining values.
              if ((value = values[i]) != null && value > max) {
                max = value;
              }
            }
          }
        }
      }

      else {
        while (++i < n) { // Find the first comparable value.
          if ((value = valueof(values[i], i, values)) != null && value >= value) {
            max = value;
            while (++i < n) { // Compare the remaining values.
              if ((value = valueof(values[i], i, values)) != null && value > max) {
                max = value;
              }
            }
          }
        }
      }

      return max;
    }

    var noop$1 = {value: function() {}};

    function dispatch$1() {
      for (var i = 0, n = arguments.length, _ = {}, t; i < n; ++i) {
        if (!(t = arguments[i] + "") || (t in _)) throw new Error("illegal type: " + t);
        _[t] = [];
      }
      return new Dispatch(_);
    }

    function Dispatch(_) {
      this._ = _;
    }

    function parseTypenames(typenames, types) {
      return typenames.trim().split(/^|\s+/).map(function(t) {
        var name = "", i = t.indexOf(".");
        if (i >= 0) name = t.slice(i + 1), t = t.slice(0, i);
        if (t && !types.hasOwnProperty(t)) throw new Error("unknown type: " + t);
        return {type: t, name: name};
      });
    }

    Dispatch.prototype = dispatch$1.prototype = {
      constructor: Dispatch,
      on: function(typename, callback) {
        var _ = this._,
            T = parseTypenames(typename + "", _),
            t,
            i = -1,
            n = T.length;

        // If no callback was specified, return the callback of the given type and name.
        if (arguments.length < 2) {
          while (++i < n) if ((t = (typename = T[i]).type) && (t = get(_[t], typename.name))) return t;
          return;
        }

        // If a type was specified, set the callback for the given type and name.
        // Otherwise, if a null callback was specified, remove callbacks of the given name.
        if (callback != null && typeof callback !== "function") throw new Error("invalid callback: " + callback);
        while (++i < n) {
          if (t = (typename = T[i]).type) _[t] = set(_[t], typename.name, callback);
          else if (callback == null) for (t in _) _[t] = set(_[t], typename.name, null);
        }

        return this;
      },
      copy: function() {
        var copy = {}, _ = this._;
        for (var t in _) copy[t] = _[t].slice();
        return new Dispatch(copy);
      },
      call: function(type, that) {
        if ((n = arguments.length - 2) > 0) for (var args = new Array(n), i = 0, n, t; i < n; ++i) args[i] = arguments[i + 2];
        if (!this._.hasOwnProperty(type)) throw new Error("unknown type: " + type);
        for (t = this._[type], i = 0, n = t.length; i < n; ++i) t[i].value.apply(that, args);
      },
      apply: function(type, that, args) {
        if (!this._.hasOwnProperty(type)) throw new Error("unknown type: " + type);
        for (var t = this._[type], i = 0, n = t.length; i < n; ++i) t[i].value.apply(that, args);
      }
    };

    function get(type, name) {
      for (var i = 0, n = type.length, c; i < n; ++i) {
        if ((c = type[i]).name === name) {
          return c.value;
        }
      }
    }

    function set(type, name, callback) {
      for (var i = 0, n = type.length; i < n; ++i) {
        if (type[i].name === name) {
          type[i] = noop$1, type = type.slice(0, i).concat(type.slice(i + 1));
          break;
        }
      }
      if (callback != null) type.push({name: name, value: callback});
      return type;
    }

    var xhtml = "http://www.w3.org/1999/xhtml";

    var namespaces = {
      svg: "http://www.w3.org/2000/svg",
      xhtml: xhtml,
      xlink: "http://www.w3.org/1999/xlink",
      xml: "http://www.w3.org/XML/1998/namespace",
      xmlns: "http://www.w3.org/2000/xmlns/"
    };

    function namespace(name) {
      var prefix = name += "", i = prefix.indexOf(":");
      if (i >= 0 && (prefix = name.slice(0, i)) !== "xmlns") name = name.slice(i + 1);
      return namespaces.hasOwnProperty(prefix) ? {space: namespaces[prefix], local: name} : name;
    }

    function creatorInherit(name) {
      return function() {
        var document = this.ownerDocument,
            uri = this.namespaceURI;
        return uri === xhtml && document.documentElement.namespaceURI === xhtml
            ? document.createElement(name)
            : document.createElementNS(uri, name);
      };
    }

    function creatorFixed(fullname) {
      return function() {
        return this.ownerDocument.createElementNS(fullname.space, fullname.local);
      };
    }

    function creator(name) {
      var fullname = namespace(name);
      return (fullname.local
          ? creatorFixed
          : creatorInherit)(fullname);
    }

    function none() {}

    function selector(selector) {
      return selector == null ? none : function() {
        return this.querySelector(selector);
      };
    }

    function selection_select(select) {
      if (typeof select !== "function") select = selector(select);

      for (var groups = this._groups, m = groups.length, subgroups = new Array(m), j = 0; j < m; ++j) {
        for (var group = groups[j], n = group.length, subgroup = subgroups[j] = new Array(n), node, subnode, i = 0; i < n; ++i) {
          if ((node = group[i]) && (subnode = select.call(node, node.__data__, i, group))) {
            if ("__data__" in node) subnode.__data__ = node.__data__;
            subgroup[i] = subnode;
          }
        }
      }

      return new Selection(subgroups, this._parents);
    }

    function empty$1() {
      return [];
    }

    function selectorAll(selector) {
      return selector == null ? empty$1 : function() {
        return this.querySelectorAll(selector);
      };
    }

    function selection_selectAll(select) {
      if (typeof select !== "function") select = selectorAll(select);

      for (var groups = this._groups, m = groups.length, subgroups = [], parents = [], j = 0; j < m; ++j) {
        for (var group = groups[j], n = group.length, node, i = 0; i < n; ++i) {
          if (node = group[i]) {
            subgroups.push(select.call(node, node.__data__, i, group));
            parents.push(node);
          }
        }
      }

      return new Selection(subgroups, parents);
    }

    function matcher(selector) {
      return function() {
        return this.matches(selector);
      };
    }

    function selection_filter(match) {
      if (typeof match !== "function") match = matcher(match);

      for (var groups = this._groups, m = groups.length, subgroups = new Array(m), j = 0; j < m; ++j) {
        for (var group = groups[j], n = group.length, subgroup = subgroups[j] = [], node, i = 0; i < n; ++i) {
          if ((node = group[i]) && match.call(node, node.__data__, i, group)) {
            subgroup.push(node);
          }
        }
      }

      return new Selection(subgroups, this._parents);
    }

    function sparse(update) {
      return new Array(update.length);
    }

    function selection_enter() {
      return new Selection(this._enter || this._groups.map(sparse), this._parents);
    }

    function EnterNode(parent, datum) {
      this.ownerDocument = parent.ownerDocument;
      this.namespaceURI = parent.namespaceURI;
      this._next = null;
      this._parent = parent;
      this.__data__ = datum;
    }

    EnterNode.prototype = {
      constructor: EnterNode,
      appendChild: function(child) { return this._parent.insertBefore(child, this._next); },
      insertBefore: function(child, next) { return this._parent.insertBefore(child, next); },
      querySelector: function(selector) { return this._parent.querySelector(selector); },
      querySelectorAll: function(selector) { return this._parent.querySelectorAll(selector); }
    };

    function constant(x) {
      return function() {
        return x;
      };
    }

    var keyPrefix = "$"; // Protect against keys like “__proto__”.

    function bindIndex(parent, group, enter, update, exit, data) {
      var i = 0,
          node,
          groupLength = group.length,
          dataLength = data.length;

      // Put any non-null nodes that fit into update.
      // Put any null nodes into enter.
      // Put any remaining data into enter.
      for (; i < dataLength; ++i) {
        if (node = group[i]) {
          node.__data__ = data[i];
          update[i] = node;
        } else {
          enter[i] = new EnterNode(parent, data[i]);
        }
      }

      // Put any non-null nodes that don’t fit into exit.
      for (; i < groupLength; ++i) {
        if (node = group[i]) {
          exit[i] = node;
        }
      }
    }

    function bindKey(parent, group, enter, update, exit, data, key) {
      var i,
          node,
          nodeByKeyValue = {},
          groupLength = group.length,
          dataLength = data.length,
          keyValues = new Array(groupLength),
          keyValue;

      // Compute the key for each node.
      // If multiple nodes have the same key, the duplicates are added to exit.
      for (i = 0; i < groupLength; ++i) {
        if (node = group[i]) {
          keyValues[i] = keyValue = keyPrefix + key.call(node, node.__data__, i, group);
          if (keyValue in nodeByKeyValue) {
            exit[i] = node;
          } else {
            nodeByKeyValue[keyValue] = node;
          }
        }
      }

      // Compute the key for each datum.
      // If there a node associated with this key, join and add it to update.
      // If there is not (or the key is a duplicate), add it to enter.
      for (i = 0; i < dataLength; ++i) {
        keyValue = keyPrefix + key.call(parent, data[i], i, data);
        if (node = nodeByKeyValue[keyValue]) {
          update[i] = node;
          node.__data__ = data[i];
          nodeByKeyValue[keyValue] = null;
        } else {
          enter[i] = new EnterNode(parent, data[i]);
        }
      }

      // Add any remaining nodes that were not bound to data to exit.
      for (i = 0; i < groupLength; ++i) {
        if ((node = group[i]) && (nodeByKeyValue[keyValues[i]] === node)) {
          exit[i] = node;
        }
      }
    }

    function selection_data(value, key) {
      if (!value) {
        data = new Array(this.size()), j = -1;
        this.each(function(d) { data[++j] = d; });
        return data;
      }

      var bind = key ? bindKey : bindIndex,
          parents = this._parents,
          groups = this._groups;

      if (typeof value !== "function") value = constant(value);

      for (var m = groups.length, update = new Array(m), enter = new Array(m), exit = new Array(m), j = 0; j < m; ++j) {
        var parent = parents[j],
            group = groups[j],
            groupLength = group.length,
            data = value.call(parent, parent && parent.__data__, j, parents),
            dataLength = data.length,
            enterGroup = enter[j] = new Array(dataLength),
            updateGroup = update[j] = new Array(dataLength),
            exitGroup = exit[j] = new Array(groupLength);

        bind(parent, group, enterGroup, updateGroup, exitGroup, data, key);

        // Now connect the enter nodes to their following update node, such that
        // appendChild can insert the materialized enter node before this node,
        // rather than at the end of the parent node.
        for (var i0 = 0, i1 = 0, previous, next; i0 < dataLength; ++i0) {
          if (previous = enterGroup[i0]) {
            if (i0 >= i1) i1 = i0 + 1;
            while (!(next = updateGroup[i1]) && ++i1 < dataLength);
            previous._next = next || null;
          }
        }
      }

      update = new Selection(update, parents);
      update._enter = enter;
      update._exit = exit;
      return update;
    }

    function selection_exit() {
      return new Selection(this._exit || this._groups.map(sparse), this._parents);
    }

    function selection_join(onenter, onupdate, onexit) {
      var enter = this.enter(), update = this, exit = this.exit();
      enter = typeof onenter === "function" ? onenter(enter) : enter.append(onenter + "");
      if (onupdate != null) update = onupdate(update);
      if (onexit == null) exit.remove(); else onexit(exit);
      return enter && update ? enter.merge(update).order() : update;
    }

    function selection_merge(selection) {

      for (var groups0 = this._groups, groups1 = selection._groups, m0 = groups0.length, m1 = groups1.length, m = Math.min(m0, m1), merges = new Array(m0), j = 0; j < m; ++j) {
        for (var group0 = groups0[j], group1 = groups1[j], n = group0.length, merge = merges[j] = new Array(n), node, i = 0; i < n; ++i) {
          if (node = group0[i] || group1[i]) {
            merge[i] = node;
          }
        }
      }

      for (; j < m0; ++j) {
        merges[j] = groups0[j];
      }

      return new Selection(merges, this._parents);
    }

    function selection_order() {

      for (var groups = this._groups, j = -1, m = groups.length; ++j < m;) {
        for (var group = groups[j], i = group.length - 1, next = group[i], node; --i >= 0;) {
          if (node = group[i]) {
            if (next && node.compareDocumentPosition(next) ^ 4) next.parentNode.insertBefore(node, next);
            next = node;
          }
        }
      }

      return this;
    }

    function selection_sort(compare) {
      if (!compare) compare = ascending$1;

      function compareNode(a, b) {
        return a && b ? compare(a.__data__, b.__data__) : !a - !b;
      }

      for (var groups = this._groups, m = groups.length, sortgroups = new Array(m), j = 0; j < m; ++j) {
        for (var group = groups[j], n = group.length, sortgroup = sortgroups[j] = new Array(n), node, i = 0; i < n; ++i) {
          if (node = group[i]) {
            sortgroup[i] = node;
          }
        }
        sortgroup.sort(compareNode);
      }

      return new Selection(sortgroups, this._parents).order();
    }

    function ascending$1(a, b) {
      return a < b ? -1 : a > b ? 1 : a >= b ? 0 : NaN;
    }

    function selection_call() {
      var callback = arguments[0];
      arguments[0] = this;
      callback.apply(null, arguments);
      return this;
    }

    function selection_nodes() {
      var nodes = new Array(this.size()), i = -1;
      this.each(function() { nodes[++i] = this; });
      return nodes;
    }

    function selection_node() {

      for (var groups = this._groups, j = 0, m = groups.length; j < m; ++j) {
        for (var group = groups[j], i = 0, n = group.length; i < n; ++i) {
          var node = group[i];
          if (node) return node;
        }
      }

      return null;
    }

    function selection_size() {
      var size = 0;
      this.each(function() { ++size; });
      return size;
    }

    function selection_empty() {
      return !this.node();
    }

    function selection_each(callback) {

      for (var groups = this._groups, j = 0, m = groups.length; j < m; ++j) {
        for (var group = groups[j], i = 0, n = group.length, node; i < n; ++i) {
          if (node = group[i]) callback.call(node, node.__data__, i, group);
        }
      }

      return this;
    }

    function attrRemove(name) {
      return function() {
        this.removeAttribute(name);
      };
    }

    function attrRemoveNS(fullname) {
      return function() {
        this.removeAttributeNS(fullname.space, fullname.local);
      };
    }

    function attrConstant(name, value) {
      return function() {
        this.setAttribute(name, value);
      };
    }

    function attrConstantNS(fullname, value) {
      return function() {
        this.setAttributeNS(fullname.space, fullname.local, value);
      };
    }

    function attrFunction(name, value) {
      return function() {
        var v = value.apply(this, arguments);
        if (v == null) this.removeAttribute(name);
        else this.setAttribute(name, v);
      };
    }

    function attrFunctionNS(fullname, value) {
      return function() {
        var v = value.apply(this, arguments);
        if (v == null) this.removeAttributeNS(fullname.space, fullname.local);
        else this.setAttributeNS(fullname.space, fullname.local, v);
      };
    }

    function selection_attr(name, value) {
      var fullname = namespace(name);

      if (arguments.length < 2) {
        var node = this.node();
        return fullname.local
            ? node.getAttributeNS(fullname.space, fullname.local)
            : node.getAttribute(fullname);
      }

      return this.each((value == null
          ? (fullname.local ? attrRemoveNS : attrRemove) : (typeof value === "function"
          ? (fullname.local ? attrFunctionNS : attrFunction)
          : (fullname.local ? attrConstantNS : attrConstant)))(fullname, value));
    }

    function defaultView(node) {
      return (node.ownerDocument && node.ownerDocument.defaultView) // node is a Node
          || (node.document && node) // node is a Window
          || node.defaultView; // node is a Document
    }

    function styleRemove(name) {
      return function() {
        this.style.removeProperty(name);
      };
    }

    function styleConstant(name, value, priority) {
      return function() {
        this.style.setProperty(name, value, priority);
      };
    }

    function styleFunction(name, value, priority) {
      return function() {
        var v = value.apply(this, arguments);
        if (v == null) this.style.removeProperty(name);
        else this.style.setProperty(name, v, priority);
      };
    }

    function selection_style(name, value, priority) {
      return arguments.length > 1
          ? this.each((value == null
                ? styleRemove : typeof value === "function"
                ? styleFunction
                : styleConstant)(name, value, priority == null ? "" : priority))
          : styleValue(this.node(), name);
    }

    function styleValue(node, name) {
      return node.style.getPropertyValue(name)
          || defaultView(node).getComputedStyle(node, null).getPropertyValue(name);
    }

    function propertyRemove(name) {
      return function() {
        delete this[name];
      };
    }

    function propertyConstant(name, value) {
      return function() {
        this[name] = value;
      };
    }

    function propertyFunction(name, value) {
      return function() {
        var v = value.apply(this, arguments);
        if (v == null) delete this[name];
        else this[name] = v;
      };
    }

    function selection_property(name, value) {
      return arguments.length > 1
          ? this.each((value == null
              ? propertyRemove : typeof value === "function"
              ? propertyFunction
              : propertyConstant)(name, value))
          : this.node()[name];
    }

    function classArray(string) {
      return string.trim().split(/^|\s+/);
    }

    function classList(node) {
      return node.classList || new ClassList(node);
    }

    function ClassList(node) {
      this._node = node;
      this._names = classArray(node.getAttribute("class") || "");
    }

    ClassList.prototype = {
      add: function(name) {
        var i = this._names.indexOf(name);
        if (i < 0) {
          this._names.push(name);
          this._node.setAttribute("class", this._names.join(" "));
        }
      },
      remove: function(name) {
        var i = this._names.indexOf(name);
        if (i >= 0) {
          this._names.splice(i, 1);
          this._node.setAttribute("class", this._names.join(" "));
        }
      },
      contains: function(name) {
        return this._names.indexOf(name) >= 0;
      }
    };

    function classedAdd(node, names) {
      var list = classList(node), i = -1, n = names.length;
      while (++i < n) list.add(names[i]);
    }

    function classedRemove(node, names) {
      var list = classList(node), i = -1, n = names.length;
      while (++i < n) list.remove(names[i]);
    }

    function classedTrue(names) {
      return function() {
        classedAdd(this, names);
      };
    }

    function classedFalse(names) {
      return function() {
        classedRemove(this, names);
      };
    }

    function classedFunction(names, value) {
      return function() {
        (value.apply(this, arguments) ? classedAdd : classedRemove)(this, names);
      };
    }

    function selection_classed(name, value) {
      var names = classArray(name + "");

      if (arguments.length < 2) {
        var list = classList(this.node()), i = -1, n = names.length;
        while (++i < n) if (!list.contains(names[i])) return false;
        return true;
      }

      return this.each((typeof value === "function"
          ? classedFunction : value
          ? classedTrue
          : classedFalse)(names, value));
    }

    function textRemove() {
      this.textContent = "";
    }

    function textConstant(value) {
      return function() {
        this.textContent = value;
      };
    }

    function textFunction(value) {
      return function() {
        var v = value.apply(this, arguments);
        this.textContent = v == null ? "" : v;
      };
    }

    function selection_text(value) {
      return arguments.length
          ? this.each(value == null
              ? textRemove : (typeof value === "function"
              ? textFunction
              : textConstant)(value))
          : this.node().textContent;
    }

    function htmlRemove() {
      this.innerHTML = "";
    }

    function htmlConstant(value) {
      return function() {
        this.innerHTML = value;
      };
    }

    function htmlFunction(value) {
      return function() {
        var v = value.apply(this, arguments);
        this.innerHTML = v == null ? "" : v;
      };
    }

    function selection_html(value) {
      return arguments.length
          ? this.each(value == null
              ? htmlRemove : (typeof value === "function"
              ? htmlFunction
              : htmlConstant)(value))
          : this.node().innerHTML;
    }

    function raise() {
      if (this.nextSibling) this.parentNode.appendChild(this);
    }

    function selection_raise() {
      return this.each(raise);
    }

    function lower() {
      if (this.previousSibling) this.parentNode.insertBefore(this, this.parentNode.firstChild);
    }

    function selection_lower() {
      return this.each(lower);
    }

    function selection_append(name) {
      var create = typeof name === "function" ? name : creator(name);
      return this.select(function() {
        return this.appendChild(create.apply(this, arguments));
      });
    }

    function constantNull() {
      return null;
    }

    function selection_insert(name, before) {
      var create = typeof name === "function" ? name : creator(name),
          select = before == null ? constantNull : typeof before === "function" ? before : selector(before);
      return this.select(function() {
        return this.insertBefore(create.apply(this, arguments), select.apply(this, arguments) || null);
      });
    }

    function remove() {
      var parent = this.parentNode;
      if (parent) parent.removeChild(this);
    }

    function selection_remove() {
      return this.each(remove);
    }

    function selection_cloneShallow() {
      return this.parentNode.insertBefore(this.cloneNode(false), this.nextSibling);
    }

    function selection_cloneDeep() {
      return this.parentNode.insertBefore(this.cloneNode(true), this.nextSibling);
    }

    function selection_clone(deep) {
      return this.select(deep ? selection_cloneDeep : selection_cloneShallow);
    }

    function selection_datum(value) {
      return arguments.length
          ? this.property("__data__", value)
          : this.node().__data__;
    }

    var filterEvents = {};

    var event = null;

    if (typeof document !== "undefined") {
      var element$1 = document.documentElement;
      if (!("onmouseenter" in element$1)) {
        filterEvents = {mouseenter: "mouseover", mouseleave: "mouseout"};
      }
    }

    function filterContextListener(listener, index, group) {
      listener = contextListener(listener, index, group);
      return function(event) {
        var related = event.relatedTarget;
        if (!related || (related !== this && !(related.compareDocumentPosition(this) & 8))) {
          listener.call(this, event);
        }
      };
    }

    function contextListener(listener, index, group) {
      return function(event1) {
        var event0 = event; // Events can be reentrant (e.g., focus).
        event = event1;
        try {
          listener.call(this, this.__data__, index, group);
        } finally {
          event = event0;
        }
      };
    }

    function parseTypenames$1(typenames) {
      return typenames.trim().split(/^|\s+/).map(function(t) {
        var name = "", i = t.indexOf(".");
        if (i >= 0) name = t.slice(i + 1), t = t.slice(0, i);
        return {type: t, name: name};
      });
    }

    function onRemove(typename) {
      return function() {
        var on = this.__on;
        if (!on) return;
        for (var j = 0, i = -1, m = on.length, o; j < m; ++j) {
          if (o = on[j], (!typename.type || o.type === typename.type) && o.name === typename.name) {
            this.removeEventListener(o.type, o.listener, o.capture);
          } else {
            on[++i] = o;
          }
        }
        if (++i) on.length = i;
        else delete this.__on;
      };
    }

    function onAdd(typename, value, capture) {
      var wrap = filterEvents.hasOwnProperty(typename.type) ? filterContextListener : contextListener;
      return function(d, i, group) {
        var on = this.__on, o, listener = wrap(value, i, group);
        if (on) for (var j = 0, m = on.length; j < m; ++j) {
          if ((o = on[j]).type === typename.type && o.name === typename.name) {
            this.removeEventListener(o.type, o.listener, o.capture);
            this.addEventListener(o.type, o.listener = listener, o.capture = capture);
            o.value = value;
            return;
          }
        }
        this.addEventListener(typename.type, listener, capture);
        o = {type: typename.type, name: typename.name, value: value, listener: listener, capture: capture};
        if (!on) this.__on = [o];
        else on.push(o);
      };
    }

    function selection_on(typename, value, capture) {
      var typenames = parseTypenames$1(typename + ""), i, n = typenames.length, t;

      if (arguments.length < 2) {
        var on = this.node().__on;
        if (on) for (var j = 0, m = on.length, o; j < m; ++j) {
          for (i = 0, o = on[j]; i < n; ++i) {
            if ((t = typenames[i]).type === o.type && t.name === o.name) {
              return o.value;
            }
          }
        }
        return;
      }

      on = value ? onAdd : onRemove;
      if (capture == null) capture = false;
      for (i = 0; i < n; ++i) this.each(on(typenames[i], value, capture));
      return this;
    }

    function customEvent(event1, listener, that, args) {
      var event0 = event;
      event1.sourceEvent = event;
      event = event1;
      try {
        return listener.apply(that, args);
      } finally {
        event = event0;
      }
    }

    function dispatchEvent(node, type, params) {
      var window = defaultView(node),
          event = window.CustomEvent;

      if (typeof event === "function") {
        event = new event(type, params);
      } else {
        event = window.document.createEvent("Event");
        if (params) event.initEvent(type, params.bubbles, params.cancelable), event.detail = params.detail;
        else event.initEvent(type, false, false);
      }

      node.dispatchEvent(event);
    }

    function dispatchConstant(type, params) {
      return function() {
        return dispatchEvent(this, type, params);
      };
    }

    function dispatchFunction(type, params) {
      return function() {
        return dispatchEvent(this, type, params.apply(this, arguments));
      };
    }

    function selection_dispatch(type, params) {
      return this.each((typeof params === "function"
          ? dispatchFunction
          : dispatchConstant)(type, params));
    }

    var root = [null];

    function Selection(groups, parents) {
      this._groups = groups;
      this._parents = parents;
    }

    function selection() {
      return new Selection([[document.documentElement]], root);
    }

    Selection.prototype = selection.prototype = {
      constructor: Selection,
      select: selection_select,
      selectAll: selection_selectAll,
      filter: selection_filter,
      data: selection_data,
      enter: selection_enter,
      exit: selection_exit,
      join: selection_join,
      merge: selection_merge,
      order: selection_order,
      sort: selection_sort,
      call: selection_call,
      nodes: selection_nodes,
      node: selection_node,
      size: selection_size,
      empty: selection_empty,
      each: selection_each,
      attr: selection_attr,
      style: selection_style,
      property: selection_property,
      classed: selection_classed,
      text: selection_text,
      html: selection_html,
      raise: selection_raise,
      lower: selection_lower,
      append: selection_append,
      insert: selection_insert,
      remove: selection_remove,
      clone: selection_clone,
      datum: selection_datum,
      on: selection_on,
      dispatch: selection_dispatch
    };

    function d3select(selector) {
      return typeof selector === "string"
          ? new Selection([[document.querySelector(selector)]], [document.documentElement])
          : new Selection([[selector]], root);
    }

    function sourceEvent() {
      var current = event, source;
      while (source = current.sourceEvent) current = source;
      return current;
    }

    function point(node, event) {
      var svg = node.ownerSVGElement || node;

      if (svg.createSVGPoint) {
        var point = svg.createSVGPoint();
        point.x = event.clientX, point.y = event.clientY;
        point = point.matrixTransform(node.getScreenCTM().inverse());
        return [point.x, point.y];
      }

      var rect = node.getBoundingClientRect();
      return [event.clientX - rect.left - node.clientLeft, event.clientY - rect.top - node.clientTop];
    }

    function mouse(node) {
      var event = sourceEvent();
      if (event.changedTouches) event = event.changedTouches[0];
      return point(node, event);
    }

    function noevent() {
      event.preventDefault();
      event.stopImmediatePropagation();
    }

    function dragDisable(view) {
      var root = view.document.documentElement,
          selection = d3select(view).on("dragstart.drag", noevent, true);
      if ("onselectstart" in root) {
        selection.on("selectstart.drag", noevent, true);
      } else {
        root.__noselect = root.style.MozUserSelect;
        root.style.MozUserSelect = "none";
      }
    }

    function yesdrag(view, noclick) {
      var root = view.document.documentElement,
          selection = d3select(view).on("dragstart.drag", null);
      if (noclick) {
        selection.on("click.drag", noevent, true);
        setTimeout(function() { selection.on("click.drag", null); }, 0);
      }
      if ("onselectstart" in root) {
        selection.on("selectstart.drag", null);
      } else {
        root.style.MozUserSelect = root.__noselect;
        delete root.__noselect;
      }
    }

    function define(constructor, factory, prototype) {
      constructor.prototype = factory.prototype = prototype;
      prototype.constructor = constructor;
    }

    function extend(parent, definition) {
      var prototype = Object.create(parent.prototype);
      for (var key in definition) prototype[key] = definition[key];
      return prototype;
    }

    function Color() {}

    var darker = 0.7;
    var brighter = 1 / darker;

    var reI = "\\s*([+-]?\\d+)\\s*",
        reN = "\\s*([+-]?\\d*\\.?\\d+(?:[eE][+-]?\\d+)?)\\s*",
        reP = "\\s*([+-]?\\d*\\.?\\d+(?:[eE][+-]?\\d+)?)%\\s*",
        reHex3 = /^#([0-9a-f]{3})$/,
        reHex6 = /^#([0-9a-f]{6})$/,
        reRgbInteger = new RegExp("^rgb\\(" + [reI, reI, reI] + "\\)$"),
        reRgbPercent = new RegExp("^rgb\\(" + [reP, reP, reP] + "\\)$"),
        reRgbaInteger = new RegExp("^rgba\\(" + [reI, reI, reI, reN] + "\\)$"),
        reRgbaPercent = new RegExp("^rgba\\(" + [reP, reP, reP, reN] + "\\)$"),
        reHslPercent = new RegExp("^hsl\\(" + [reN, reP, reP] + "\\)$"),
        reHslaPercent = new RegExp("^hsla\\(" + [reN, reP, reP, reN] + "\\)$");

    var named = {
      aliceblue: 0xf0f8ff,
      antiquewhite: 0xfaebd7,
      aqua: 0x00ffff,
      aquamarine: 0x7fffd4,
      azure: 0xf0ffff,
      beige: 0xf5f5dc,
      bisque: 0xffe4c4,
      black: 0x000000,
      blanchedalmond: 0xffebcd,
      blue: 0x0000ff,
      blueviolet: 0x8a2be2,
      brown: 0xa52a2a,
      burlywood: 0xdeb887,
      cadetblue: 0x5f9ea0,
      chartreuse: 0x7fff00,
      chocolate: 0xd2691e,
      coral: 0xff7f50,
      cornflowerblue: 0x6495ed,
      cornsilk: 0xfff8dc,
      crimson: 0xdc143c,
      cyan: 0x00ffff,
      darkblue: 0x00008b,
      darkcyan: 0x008b8b,
      darkgoldenrod: 0xb8860b,
      darkgray: 0xa9a9a9,
      darkgreen: 0x006400,
      darkgrey: 0xa9a9a9,
      darkkhaki: 0xbdb76b,
      darkmagenta: 0x8b008b,
      darkolivegreen: 0x556b2f,
      darkorange: 0xff8c00,
      darkorchid: 0x9932cc,
      darkred: 0x8b0000,
      darksalmon: 0xe9967a,
      darkseagreen: 0x8fbc8f,
      darkslateblue: 0x483d8b,
      darkslategray: 0x2f4f4f,
      darkslategrey: 0x2f4f4f,
      darkturquoise: 0x00ced1,
      darkviolet: 0x9400d3,
      deeppink: 0xff1493,
      deepskyblue: 0x00bfff,
      dimgray: 0x696969,
      dimgrey: 0x696969,
      dodgerblue: 0x1e90ff,
      firebrick: 0xb22222,
      floralwhite: 0xfffaf0,
      forestgreen: 0x228b22,
      fuchsia: 0xff00ff,
      gainsboro: 0xdcdcdc,
      ghostwhite: 0xf8f8ff,
      gold: 0xffd700,
      goldenrod: 0xdaa520,
      gray: 0x808080,
      green: 0x008000,
      greenyellow: 0xadff2f,
      grey: 0x808080,
      honeydew: 0xf0fff0,
      hotpink: 0xff69b4,
      indianred: 0xcd5c5c,
      indigo: 0x4b0082,
      ivory: 0xfffff0,
      khaki: 0xf0e68c,
      lavender: 0xe6e6fa,
      lavenderblush: 0xfff0f5,
      lawngreen: 0x7cfc00,
      lemonchiffon: 0xfffacd,
      lightblue: 0xadd8e6,
      lightcoral: 0xf08080,
      lightcyan: 0xe0ffff,
      lightgoldenrodyellow: 0xfafad2,
      lightgray: 0xd3d3d3,
      lightgreen: 0x90ee90,
      lightgrey: 0xd3d3d3,
      lightpink: 0xffb6c1,
      lightsalmon: 0xffa07a,
      lightseagreen: 0x20b2aa,
      lightskyblue: 0x87cefa,
      lightslategray: 0x778899,
      lightslategrey: 0x778899,
      lightsteelblue: 0xb0c4de,
      lightyellow: 0xffffe0,
      lime: 0x00ff00,
      limegreen: 0x32cd32,
      linen: 0xfaf0e6,
      magenta: 0xff00ff,
      maroon: 0x800000,
      mediumaquamarine: 0x66cdaa,
      mediumblue: 0x0000cd,
      mediumorchid: 0xba55d3,
      mediumpurple: 0x9370db,
      mediumseagreen: 0x3cb371,
      mediumslateblue: 0x7b68ee,
      mediumspringgreen: 0x00fa9a,
      mediumturquoise: 0x48d1cc,
      mediumvioletred: 0xc71585,
      midnightblue: 0x191970,
      mintcream: 0xf5fffa,
      mistyrose: 0xffe4e1,
      moccasin: 0xffe4b5,
      navajowhite: 0xffdead,
      navy: 0x000080,
      oldlace: 0xfdf5e6,
      olive: 0x808000,
      olivedrab: 0x6b8e23,
      orange: 0xffa500,
      orangered: 0xff4500,
      orchid: 0xda70d6,
      palegoldenrod: 0xeee8aa,
      palegreen: 0x98fb98,
      paleturquoise: 0xafeeee,
      palevioletred: 0xdb7093,
      papayawhip: 0xffefd5,
      peachpuff: 0xffdab9,
      peru: 0xcd853f,
      pink: 0xffc0cb,
      plum: 0xdda0dd,
      powderblue: 0xb0e0e6,
      purple: 0x800080,
      rebeccapurple: 0x663399,
      red: 0xff0000,
      rosybrown: 0xbc8f8f,
      royalblue: 0x4169e1,
      saddlebrown: 0x8b4513,
      salmon: 0xfa8072,
      sandybrown: 0xf4a460,
      seagreen: 0x2e8b57,
      seashell: 0xfff5ee,
      sienna: 0xa0522d,
      silver: 0xc0c0c0,
      skyblue: 0x87ceeb,
      slateblue: 0x6a5acd,
      slategray: 0x708090,
      slategrey: 0x708090,
      snow: 0xfffafa,
      springgreen: 0x00ff7f,
      steelblue: 0x4682b4,
      tan: 0xd2b48c,
      teal: 0x008080,
      thistle: 0xd8bfd8,
      tomato: 0xff6347,
      turquoise: 0x40e0d0,
      violet: 0xee82ee,
      wheat: 0xf5deb3,
      white: 0xffffff,
      whitesmoke: 0xf5f5f5,
      yellow: 0xffff00,
      yellowgreen: 0x9acd32
    };

    define(Color, color, {
      displayable: function() {
        return this.rgb().displayable();
      },
      hex: function() {
        return this.rgb().hex();
      },
      toString: function() {
        return this.rgb() + "";
      }
    });

    function color(format) {
      var m;
      format = (format + "").trim().toLowerCase();
      return (m = reHex3.exec(format)) ? (m = parseInt(m[1], 16), new Rgb((m >> 8 & 0xf) | (m >> 4 & 0x0f0), (m >> 4 & 0xf) | (m & 0xf0), ((m & 0xf) << 4) | (m & 0xf), 1)) // #f00
          : (m = reHex6.exec(format)) ? rgbn(parseInt(m[1], 16)) // #ff0000
          : (m = reRgbInteger.exec(format)) ? new Rgb(m[1], m[2], m[3], 1) // rgb(255, 0, 0)
          : (m = reRgbPercent.exec(format)) ? new Rgb(m[1] * 255 / 100, m[2] * 255 / 100, m[3] * 255 / 100, 1) // rgb(100%, 0%, 0%)
          : (m = reRgbaInteger.exec(format)) ? rgba(m[1], m[2], m[3], m[4]) // rgba(255, 0, 0, 1)
          : (m = reRgbaPercent.exec(format)) ? rgba(m[1] * 255 / 100, m[2] * 255 / 100, m[3] * 255 / 100, m[4]) // rgb(100%, 0%, 0%, 1)
          : (m = reHslPercent.exec(format)) ? hsla(m[1], m[2] / 100, m[3] / 100, 1) // hsl(120, 50%, 50%)
          : (m = reHslaPercent.exec(format)) ? hsla(m[1], m[2] / 100, m[3] / 100, m[4]) // hsla(120, 50%, 50%, 1)
          : named.hasOwnProperty(format) ? rgbn(named[format])
          : format === "transparent" ? new Rgb(NaN, NaN, NaN, 0)
          : null;
    }

    function rgbn(n) {
      return new Rgb(n >> 16 & 0xff, n >> 8 & 0xff, n & 0xff, 1);
    }

    function rgba(r, g, b, a) {
      if (a <= 0) r = g = b = NaN;
      return new Rgb(r, g, b, a);
    }

    function rgbConvert(o) {
      if (!(o instanceof Color)) o = color(o);
      if (!o) return new Rgb;
      o = o.rgb();
      return new Rgb(o.r, o.g, o.b, o.opacity);
    }

    function rgb(r, g, b, opacity) {
      return arguments.length === 1 ? rgbConvert(r) : new Rgb(r, g, b, opacity == null ? 1 : opacity);
    }

    function Rgb(r, g, b, opacity) {
      this.r = +r;
      this.g = +g;
      this.b = +b;
      this.opacity = +opacity;
    }

    define(Rgb, rgb, extend(Color, {
      brighter: function(k) {
        k = k == null ? brighter : Math.pow(brighter, k);
        return new Rgb(this.r * k, this.g * k, this.b * k, this.opacity);
      },
      darker: function(k) {
        k = k == null ? darker : Math.pow(darker, k);
        return new Rgb(this.r * k, this.g * k, this.b * k, this.opacity);
      },
      rgb: function() {
        return this;
      },
      displayable: function() {
        return (-0.5 <= this.r && this.r < 255.5)
            && (-0.5 <= this.g && this.g < 255.5)
            && (-0.5 <= this.b && this.b < 255.5)
            && (0 <= this.opacity && this.opacity <= 1);
      },
      hex: function() {
        return "#" + hex(this.r) + hex(this.g) + hex(this.b);
      },
      toString: function() {
        var a = this.opacity; a = isNaN(a) ? 1 : Math.max(0, Math.min(1, a));
        return (a === 1 ? "rgb(" : "rgba(")
            + Math.max(0, Math.min(255, Math.round(this.r) || 0)) + ", "
            + Math.max(0, Math.min(255, Math.round(this.g) || 0)) + ", "
            + Math.max(0, Math.min(255, Math.round(this.b) || 0))
            + (a === 1 ? ")" : ", " + a + ")");
      }
    }));

    function hex(value) {
      value = Math.max(0, Math.min(255, Math.round(value) || 0));
      return (value < 16 ? "0" : "") + value.toString(16);
    }

    function hsla(h, s, l, a) {
      if (a <= 0) h = s = l = NaN;
      else if (l <= 0 || l >= 1) h = s = NaN;
      else if (s <= 0) h = NaN;
      return new Hsl(h, s, l, a);
    }

    function hslConvert(o) {
      if (o instanceof Hsl) return new Hsl(o.h, o.s, o.l, o.opacity);
      if (!(o instanceof Color)) o = color(o);
      if (!o) return new Hsl;
      if (o instanceof Hsl) return o;
      o = o.rgb();
      var r = o.r / 255,
          g = o.g / 255,
          b = o.b / 255,
          min = Math.min(r, g, b),
          max = Math.max(r, g, b),
          h = NaN,
          s = max - min,
          l = (max + min) / 2;
      if (s) {
        if (r === max) h = (g - b) / s + (g < b) * 6;
        else if (g === max) h = (b - r) / s + 2;
        else h = (r - g) / s + 4;
        s /= l < 0.5 ? max + min : 2 - max - min;
        h *= 60;
      } else {
        s = l > 0 && l < 1 ? 0 : h;
      }
      return new Hsl(h, s, l, o.opacity);
    }

    function hsl(h, s, l, opacity) {
      return arguments.length === 1 ? hslConvert(h) : new Hsl(h, s, l, opacity == null ? 1 : opacity);
    }

    function Hsl(h, s, l, opacity) {
      this.h = +h;
      this.s = +s;
      this.l = +l;
      this.opacity = +opacity;
    }

    define(Hsl, hsl, extend(Color, {
      brighter: function(k) {
        k = k == null ? brighter : Math.pow(brighter, k);
        return new Hsl(this.h, this.s, this.l * k, this.opacity);
      },
      darker: function(k) {
        k = k == null ? darker : Math.pow(darker, k);
        return new Hsl(this.h, this.s, this.l * k, this.opacity);
      },
      rgb: function() {
        var h = this.h % 360 + (this.h < 0) * 360,
            s = isNaN(h) || isNaN(this.s) ? 0 : this.s,
            l = this.l,
            m2 = l + (l < 0.5 ? l : 1 - l) * s,
            m1 = 2 * l - m2;
        return new Rgb(
          hsl2rgb(h >= 240 ? h - 240 : h + 120, m1, m2),
          hsl2rgb(h, m1, m2),
          hsl2rgb(h < 120 ? h + 240 : h - 120, m1, m2),
          this.opacity
        );
      },
      displayable: function() {
        return (0 <= this.s && this.s <= 1 || isNaN(this.s))
            && (0 <= this.l && this.l <= 1)
            && (0 <= this.opacity && this.opacity <= 1);
      }
    }));

    /* From FvD 13.37, CSS Color Module Level 3 */
    function hsl2rgb(h, m1, m2) {
      return (h < 60 ? m1 + (m2 - m1) * h / 60
          : h < 180 ? m2
          : h < 240 ? m1 + (m2 - m1) * (240 - h) / 60
          : m1) * 255;
    }

    var deg2rad = Math.PI / 180;
    var rad2deg = 180 / Math.PI;

    // https://observablehq.com/@mbostock/lab-and-rgb
    var K = 18,
        Xn = 0.96422,
        Yn = 1,
        Zn = 0.82521,
        t0 = 4 / 29,
        t1 = 6 / 29,
        t2 = 3 * t1 * t1,
        t3 = t1 * t1 * t1;

    function labConvert(o) {
      if (o instanceof Lab) return new Lab(o.l, o.a, o.b, o.opacity);
      if (o instanceof Hcl) return hcl2lab(o);
      if (!(o instanceof Rgb)) o = rgbConvert(o);
      var r = rgb2lrgb(o.r),
          g = rgb2lrgb(o.g),
          b = rgb2lrgb(o.b),
          y = xyz2lab((0.2225045 * r + 0.7168786 * g + 0.0606169 * b) / Yn), x, z;
      if (r === g && g === b) x = z = y; else {
        x = xyz2lab((0.4360747 * r + 0.3850649 * g + 0.1430804 * b) / Xn);
        z = xyz2lab((0.0139322 * r + 0.0971045 * g + 0.7141733 * b) / Zn);
      }
      return new Lab(116 * y - 16, 500 * (x - y), 200 * (y - z), o.opacity);
    }

    function lab(l, a, b, opacity) {
      return arguments.length === 1 ? labConvert(l) : new Lab(l, a, b, opacity == null ? 1 : opacity);
    }

    function Lab(l, a, b, opacity) {
      this.l = +l;
      this.a = +a;
      this.b = +b;
      this.opacity = +opacity;
    }

    define(Lab, lab, extend(Color, {
      brighter: function(k) {
        return new Lab(this.l + K * (k == null ? 1 : k), this.a, this.b, this.opacity);
      },
      darker: function(k) {
        return new Lab(this.l - K * (k == null ? 1 : k), this.a, this.b, this.opacity);
      },
      rgb: function() {
        var y = (this.l + 16) / 116,
            x = isNaN(this.a) ? y : y + this.a / 500,
            z = isNaN(this.b) ? y : y - this.b / 200;
        x = Xn * lab2xyz(x);
        y = Yn * lab2xyz(y);
        z = Zn * lab2xyz(z);
        return new Rgb(
          lrgb2rgb( 3.1338561 * x - 1.6168667 * y - 0.4906146 * z),
          lrgb2rgb(-0.9787684 * x + 1.9161415 * y + 0.0334540 * z),
          lrgb2rgb( 0.0719453 * x - 0.2289914 * y + 1.4052427 * z),
          this.opacity
        );
      }
    }));

    function xyz2lab(t) {
      return t > t3 ? Math.pow(t, 1 / 3) : t / t2 + t0;
    }

    function lab2xyz(t) {
      return t > t1 ? t * t * t : t2 * (t - t0);
    }

    function lrgb2rgb(x) {
      return 255 * (x <= 0.0031308 ? 12.92 * x : 1.055 * Math.pow(x, 1 / 2.4) - 0.055);
    }

    function rgb2lrgb(x) {
      return (x /= 255) <= 0.04045 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
    }

    function hclConvert(o) {
      if (o instanceof Hcl) return new Hcl(o.h, o.c, o.l, o.opacity);
      if (!(o instanceof Lab)) o = labConvert(o);
      if (o.a === 0 && o.b === 0) return new Hcl(NaN, 0 < o.l && o.l < 100 ? 0 : NaN, o.l, o.opacity);
      var h = Math.atan2(o.b, o.a) * rad2deg;
      return new Hcl(h < 0 ? h + 360 : h, Math.sqrt(o.a * o.a + o.b * o.b), o.l, o.opacity);
    }

    function hcl(h, c, l, opacity) {
      return arguments.length === 1 ? hclConvert(h) : new Hcl(h, c, l, opacity == null ? 1 : opacity);
    }

    function Hcl(h, c, l, opacity) {
      this.h = +h;
      this.c = +c;
      this.l = +l;
      this.opacity = +opacity;
    }

    function hcl2lab(o) {
      if (isNaN(o.h)) return new Lab(o.l, 0, 0, o.opacity);
      var h = o.h * deg2rad;
      return new Lab(o.l, Math.cos(h) * o.c, Math.sin(h) * o.c, o.opacity);
    }

    define(Hcl, hcl, extend(Color, {
      brighter: function(k) {
        return new Hcl(this.h, this.c, this.l + K * (k == null ? 1 : k), this.opacity);
      },
      darker: function(k) {
        return new Hcl(this.h, this.c, this.l - K * (k == null ? 1 : k), this.opacity);
      },
      rgb: function() {
        return hcl2lab(this).rgb();
      }
    }));

    var A = -0.14861,
        B = +1.78277,
        C = -0.29227,
        D = -0.90649,
        E = +1.97294,
        ED = E * D,
        EB = E * B,
        BC_DA = B * C - D * A;

    function cubehelixConvert(o) {
      if (o instanceof Cubehelix) return new Cubehelix(o.h, o.s, o.l, o.opacity);
      if (!(o instanceof Rgb)) o = rgbConvert(o);
      var r = o.r / 255,
          g = o.g / 255,
          b = o.b / 255,
          l = (BC_DA * b + ED * r - EB * g) / (BC_DA + ED - EB),
          bl = b - l,
          k = (E * (g - l) - C * bl) / D,
          s = Math.sqrt(k * k + bl * bl) / (E * l * (1 - l)), // NaN if l=0 or l=1
          h = s ? Math.atan2(k, bl) * rad2deg - 120 : NaN;
      return new Cubehelix(h < 0 ? h + 360 : h, s, l, o.opacity);
    }

    function cubehelix(h, s, l, opacity) {
      return arguments.length === 1 ? cubehelixConvert(h) : new Cubehelix(h, s, l, opacity == null ? 1 : opacity);
    }

    function Cubehelix(h, s, l, opacity) {
      this.h = +h;
      this.s = +s;
      this.l = +l;
      this.opacity = +opacity;
    }

    define(Cubehelix, cubehelix, extend(Color, {
      brighter: function(k) {
        k = k == null ? brighter : Math.pow(brighter, k);
        return new Cubehelix(this.h, this.s, this.l * k, this.opacity);
      },
      darker: function(k) {
        k = k == null ? darker : Math.pow(darker, k);
        return new Cubehelix(this.h, this.s, this.l * k, this.opacity);
      },
      rgb: function() {
        var h = isNaN(this.h) ? 0 : (this.h + 120) * deg2rad,
            l = +this.l,
            a = isNaN(this.s) ? 0 : this.s * l * (1 - l),
            cosh = Math.cos(h),
            sinh = Math.sin(h);
        return new Rgb(
          255 * (l + a * (A * cosh + B * sinh)),
          255 * (l + a * (C * cosh + D * sinh)),
          255 * (l + a * (E * cosh)),
          this.opacity
        );
      }
    }));

    function basis(t1, v0, v1, v2, v3) {
      var t2 = t1 * t1, t3 = t2 * t1;
      return ((1 - 3 * t1 + 3 * t2 - t3) * v0
          + (4 - 6 * t2 + 3 * t3) * v1
          + (1 + 3 * t1 + 3 * t2 - 3 * t3) * v2
          + t3 * v3) / 6;
    }

    function basis$1(values) {
      var n = values.length - 1;
      return function(t) {
        var i = t <= 0 ? (t = 0) : t >= 1 ? (t = 1, n - 1) : Math.floor(t * n),
            v1 = values[i],
            v2 = values[i + 1],
            v0 = i > 0 ? values[i - 1] : 2 * v1 - v2,
            v3 = i < n - 1 ? values[i + 2] : 2 * v2 - v1;
        return basis((t - i / n) * n, v0, v1, v2, v3);
      };
    }

    function constant$1(x) {
      return function() {
        return x;
      };
    }

    function linear(a, d) {
      return function(t) {
        return a + t * d;
      };
    }

    function exponential(a, b, y) {
      return a = Math.pow(a, y), b = Math.pow(b, y) - a, y = 1 / y, function(t) {
        return Math.pow(a + t * b, y);
      };
    }

    function hue(a, b) {
      var d = b - a;
      return d ? linear(a, d > 180 || d < -180 ? d - 360 * Math.round(d / 360) : d) : constant$1(isNaN(a) ? b : a);
    }

    function gamma(y) {
      return (y = +y) === 1 ? nogamma : function(a, b) {
        return b - a ? exponential(a, b, y) : constant$1(isNaN(a) ? b : a);
      };
    }

    function nogamma(a, b) {
      var d = b - a;
      return d ? linear(a, d) : constant$1(isNaN(a) ? b : a);
    }

    var interpolateRgb = (function rgbGamma(y) {
      var color = gamma(y);

      function rgb$1(start, end) {
        var r = color((start = rgb(start)).r, (end = rgb(end)).r),
            g = color(start.g, end.g),
            b = color(start.b, end.b),
            opacity = nogamma(start.opacity, end.opacity);
        return function(t) {
          start.r = r(t);
          start.g = g(t);
          start.b = b(t);
          start.opacity = opacity(t);
          return start + "";
        };
      }

      rgb$1.gamma = rgbGamma;

      return rgb$1;
    })(1);

    function rgbSpline(spline) {
      return function(colors) {
        var n = colors.length,
            r = new Array(n),
            g = new Array(n),
            b = new Array(n),
            i, color;
        for (i = 0; i < n; ++i) {
          color = rgb(colors[i]);
          r[i] = color.r || 0;
          g[i] = color.g || 0;
          b[i] = color.b || 0;
        }
        r = spline(r);
        g = spline(g);
        b = spline(b);
        color.opacity = 1;
        return function(t) {
          color.r = r(t);
          color.g = g(t);
          color.b = b(t);
          return color + "";
        };
      };
    }

    var rgbBasis = rgbSpline(basis$1);

    function array(a, b) {
      var nb = b ? b.length : 0,
          na = a ? Math.min(nb, a.length) : 0,
          x = new Array(na),
          c = new Array(nb),
          i;

      for (i = 0; i < na; ++i) x[i] = interpolateValue(a[i], b[i]);
      for (; i < nb; ++i) c[i] = b[i];

      return function(t) {
        for (i = 0; i < na; ++i) c[i] = x[i](t);
        return c;
      };
    }

    function date(a, b) {
      var d = new Date;
      return a = +a, b -= a, function(t) {
        return d.setTime(a + b * t), d;
      };
    }

    function interpolateNumber(a, b) {
      return a = +a, b -= a, function(t) {
        return a + b * t;
      };
    }

    function object(a, b) {
      var i = {},
          c = {},
          k;

      if (a === null || typeof a !== "object") a = {};
      if (b === null || typeof b !== "object") b = {};

      for (k in b) {
        if (k in a) {
          i[k] = interpolateValue(a[k], b[k]);
        } else {
          c[k] = b[k];
        }
      }

      return function(t) {
        for (k in i) c[k] = i[k](t);
        return c;
      };
    }

    var reA = /[-+]?(?:\d+\.?\d*|\.?\d+)(?:[eE][-+]?\d+)?/g,
        reB = new RegExp(reA.source, "g");

    function zero(b) {
      return function() {
        return b;
      };
    }

    function one(b) {
      return function(t) {
        return b(t) + "";
      };
    }

    function interpolateString(a, b) {
      var bi = reA.lastIndex = reB.lastIndex = 0, // scan index for next number in b
          am, // current match in a
          bm, // current match in b
          bs, // string preceding current number in b, if any
          i = -1, // index in s
          s = [], // string constants and placeholders
          q = []; // number interpolators

      // Coerce inputs to strings.
      a = a + "", b = b + "";

      // Interpolate pairs of numbers in a & b.
      while ((am = reA.exec(a))
          && (bm = reB.exec(b))) {
        if ((bs = bm.index) > bi) { // a string precedes the next number in b
          bs = b.slice(bi, bs);
          if (s[i]) s[i] += bs; // coalesce with previous string
          else s[++i] = bs;
        }
        if ((am = am[0]) === (bm = bm[0])) { // numbers in a & b match
          if (s[i]) s[i] += bm; // coalesce with previous string
          else s[++i] = bm;
        } else { // interpolate non-matching numbers
          s[++i] = null;
          q.push({i: i, x: interpolateNumber(am, bm)});
        }
        bi = reB.lastIndex;
      }

      // Add remains of b.
      if (bi < b.length) {
        bs = b.slice(bi);
        if (s[i]) s[i] += bs; // coalesce with previous string
        else s[++i] = bs;
      }

      // Special optimization for only a single match.
      // Otherwise, interpolate each of the numbers and rejoin the string.
      return s.length < 2 ? (q[0]
          ? one(q[0].x)
          : zero(b))
          : (b = q.length, function(t) {
              for (var i = 0, o; i < b; ++i) s[(o = q[i]).i] = o.x(t);
              return s.join("");
            });
    }

    function interpolateValue(a, b) {
      var t = typeof b, c;
      return b == null || t === "boolean" ? constant$1(b)
          : (t === "number" ? interpolateNumber
          : t === "string" ? ((c = color(b)) ? (b = c, interpolateRgb) : interpolateString)
          : b instanceof color ? interpolateRgb
          : b instanceof Date ? date
          : Array.isArray(b) ? array
          : typeof b.valueOf !== "function" && typeof b.toString !== "function" || isNaN(b) ? object
          : interpolateNumber)(a, b);
    }

    function interpolateRound(a, b) {
      return a = +a, b -= a, function(t) {
        return Math.round(a + b * t);
      };
    }

    var degrees = 180 / Math.PI;

    var identity$1 = {
      translateX: 0,
      translateY: 0,
      rotate: 0,
      skewX: 0,
      scaleX: 1,
      scaleY: 1
    };

    function decompose(a, b, c, d, e, f) {
      var scaleX, scaleY, skewX;
      if (scaleX = Math.sqrt(a * a + b * b)) a /= scaleX, b /= scaleX;
      if (skewX = a * c + b * d) c -= a * skewX, d -= b * skewX;
      if (scaleY = Math.sqrt(c * c + d * d)) c /= scaleY, d /= scaleY, skewX /= scaleY;
      if (a * d < b * c) a = -a, b = -b, skewX = -skewX, scaleX = -scaleX;
      return {
        translateX: e,
        translateY: f,
        rotate: Math.atan2(b, a) * degrees,
        skewX: Math.atan(skewX) * degrees,
        scaleX: scaleX,
        scaleY: scaleY
      };
    }

    var cssNode,
        cssRoot,
        cssView,
        svgNode;

    function parseCss(value) {
      if (value === "none") return identity$1;
      if (!cssNode) cssNode = document.createElement("DIV"), cssRoot = document.documentElement, cssView = document.defaultView;
      cssNode.style.transform = value;
      value = cssView.getComputedStyle(cssRoot.appendChild(cssNode), null).getPropertyValue("transform");
      cssRoot.removeChild(cssNode);
      value = value.slice(7, -1).split(",");
      return decompose(+value[0], +value[1], +value[2], +value[3], +value[4], +value[5]);
    }

    function parseSvg(value) {
      if (value == null) return identity$1;
      if (!svgNode) svgNode = document.createElementNS("http://www.w3.org/2000/svg", "g");
      svgNode.setAttribute("transform", value);
      if (!(value = svgNode.transform.baseVal.consolidate())) return identity$1;
      value = value.matrix;
      return decompose(value.a, value.b, value.c, value.d, value.e, value.f);
    }

    function interpolateTransform(parse, pxComma, pxParen, degParen) {

      function pop(s) {
        return s.length ? s.pop() + " " : "";
      }

      function translate(xa, ya, xb, yb, s, q) {
        if (xa !== xb || ya !== yb) {
          var i = s.push("translate(", null, pxComma, null, pxParen);
          q.push({i: i - 4, x: interpolateNumber(xa, xb)}, {i: i - 2, x: interpolateNumber(ya, yb)});
        } else if (xb || yb) {
          s.push("translate(" + xb + pxComma + yb + pxParen);
        }
      }

      function rotate(a, b, s, q) {
        if (a !== b) {
          if (a - b > 180) b += 360; else if (b - a > 180) a += 360; // shortest path
          q.push({i: s.push(pop(s) + "rotate(", null, degParen) - 2, x: interpolateNumber(a, b)});
        } else if (b) {
          s.push(pop(s) + "rotate(" + b + degParen);
        }
      }

      function skewX(a, b, s, q) {
        if (a !== b) {
          q.push({i: s.push(pop(s) + "skewX(", null, degParen) - 2, x: interpolateNumber(a, b)});
        } else if (b) {
          s.push(pop(s) + "skewX(" + b + degParen);
        }
      }

      function scale(xa, ya, xb, yb, s, q) {
        if (xa !== xb || ya !== yb) {
          var i = s.push(pop(s) + "scale(", null, ",", null, ")");
          q.push({i: i - 4, x: interpolateNumber(xa, xb)}, {i: i - 2, x: interpolateNumber(ya, yb)});
        } else if (xb !== 1 || yb !== 1) {
          s.push(pop(s) + "scale(" + xb + "," + yb + ")");
        }
      }

      return function(a, b) {
        var s = [], // string constants and placeholders
            q = []; // number interpolators
        a = parse(a), b = parse(b);
        translate(a.translateX, a.translateY, b.translateX, b.translateY, s, q);
        rotate(a.rotate, b.rotate, s, q);
        skewX(a.skewX, b.skewX, s, q);
        scale(a.scaleX, a.scaleY, b.scaleX, b.scaleY, s, q);
        a = b = null; // gc
        return function(t) {
          var i = -1, n = q.length, o;
          while (++i < n) s[(o = q[i]).i] = o.x(t);
          return s.join("");
        };
      };
    }

    var interpolateTransformCss = interpolateTransform(parseCss, "px, ", "px)", "deg)");
    var interpolateTransformSvg = interpolateTransform(parseSvg, ", ", ")", ")");

    var rho = Math.SQRT2;

    function cubehelix$1(hue) {
      return (function cubehelixGamma(y) {
        y = +y;

        function cubehelix$1(start, end) {
          var h = hue((start = cubehelix(start)).h, (end = cubehelix(end)).h),
              s = nogamma(start.s, end.s),
              l = nogamma(start.l, end.l),
              opacity = nogamma(start.opacity, end.opacity);
          return function(t) {
            start.h = h(t);
            start.s = s(t);
            start.l = l(Math.pow(t, y));
            start.opacity = opacity(t);
            return start + "";
          };
        }

        cubehelix$1.gamma = cubehelixGamma;

        return cubehelix$1;
      })(1);
    }

    cubehelix$1(hue);
    var cubehelixLong = cubehelix$1(nogamma);

    var frame = 0, // is an animation frame pending?
        timeout = 0, // is a timeout pending?
        interval = 0, // are any timers active?
        pokeDelay = 1000, // how frequently we check for clock skew
        taskHead,
        taskTail,
        clockLast = 0,
        clockNow = 0,
        clockSkew = 0,
        clock = typeof performance === "object" && performance.now ? performance : Date,
        setFrame = typeof window === "object" && window.requestAnimationFrame ? window.requestAnimationFrame.bind(window) : function(f) { setTimeout(f, 17); };

    function now$1() {
      return clockNow || (setFrame(clearNow), clockNow = clock.now() + clockSkew);
    }

    function clearNow() {
      clockNow = 0;
    }

    function Timer() {
      this._call =
      this._time =
      this._next = null;
    }

    Timer.prototype = timer.prototype = {
      constructor: Timer,
      restart: function(callback, delay, time) {
        if (typeof callback !== "function") throw new TypeError("callback is not a function");
        time = (time == null ? now$1() : +time) + (delay == null ? 0 : +delay);
        if (!this._next && taskTail !== this) {
          if (taskTail) taskTail._next = this;
          else taskHead = this;
          taskTail = this;
        }
        this._call = callback;
        this._time = time;
        sleep();
      },
      stop: function() {
        if (this._call) {
          this._call = null;
          this._time = Infinity;
          sleep();
        }
      }
    };

    function timer(callback, delay, time) {
      var t = new Timer;
      t.restart(callback, delay, time);
      return t;
    }

    function timerFlush() {
      now$1(); // Get the current time, if not already set.
      ++frame; // Pretend we’ve set an alarm, if we haven’t already.
      var t = taskHead, e;
      while (t) {
        if ((e = clockNow - t._time) >= 0) t._call.call(null, e);
        t = t._next;
      }
      --frame;
    }

    function wake() {
      clockNow = (clockLast = clock.now()) + clockSkew;
      frame = timeout = 0;
      try {
        timerFlush();
      } finally {
        frame = 0;
        nap();
        clockNow = 0;
      }
    }

    function poke() {
      var now = clock.now(), delay = now - clockLast;
      if (delay > pokeDelay) clockSkew -= delay, clockLast = now;
    }

    function nap() {
      var t0, t1 = taskHead, t2, time = Infinity;
      while (t1) {
        if (t1._call) {
          if (time > t1._time) time = t1._time;
          t0 = t1, t1 = t1._next;
        } else {
          t2 = t1._next, t1._next = null;
          t1 = t0 ? t0._next = t2 : taskHead = t2;
        }
      }
      taskTail = t0;
      sleep(time);
    }

    function sleep(time) {
      if (frame) return; // Soonest alarm already set, or will be.
      if (timeout) timeout = clearTimeout(timeout);
      var delay = time - clockNow; // Strictly less than if we recomputed clockNow.
      if (delay > 24) {
        if (time < Infinity) timeout = setTimeout(wake, time - clock.now() - clockSkew);
        if (interval) interval = clearInterval(interval);
      } else {
        if (!interval) clockLast = clock.now(), interval = setInterval(poke, pokeDelay);
        frame = 1, setFrame(wake);
      }
    }

    function timeout$1(callback, delay, time) {
      var t = new Timer;
      delay = delay == null ? 0 : +delay;
      t.restart(function(elapsed) {
        t.stop();
        callback(elapsed + delay);
      }, delay, time);
      return t;
    }

    var emptyOn = dispatch$1("start", "end", "cancel", "interrupt");
    var emptyTween = [];

    var CREATED = 0;
    var SCHEDULED = 1;
    var STARTING = 2;
    var STARTED = 3;
    var RUNNING = 4;
    var ENDING = 5;
    var ENDED = 6;

    function schedule(node, name, id, index, group, timing) {
      var schedules = node.__transition;
      if (!schedules) node.__transition = {};
      else if (id in schedules) return;
      create(node, id, {
        name: name,
        index: index, // For context during callback.
        group: group, // For context during callback.
        on: emptyOn,
        tween: emptyTween,
        time: timing.time,
        delay: timing.delay,
        duration: timing.duration,
        ease: timing.ease,
        timer: null,
        state: CREATED
      });
    }

    function init$1(node, id) {
      var schedule = get$1(node, id);
      if (schedule.state > CREATED) throw new Error("too late; already scheduled");
      return schedule;
    }

    function set$1(node, id) {
      var schedule = get$1(node, id);
      if (schedule.state > STARTED) throw new Error("too late; already running");
      return schedule;
    }

    function get$1(node, id) {
      var schedule = node.__transition;
      if (!schedule || !(schedule = schedule[id])) throw new Error("transition not found");
      return schedule;
    }

    function create(node, id, self) {
      var schedules = node.__transition,
          tween;

      // Initialize the self timer when the transition is created.
      // Note the actual delay is not known until the first callback!
      schedules[id] = self;
      self.timer = timer(schedule, 0, self.time);

      function schedule(elapsed) {
        self.state = SCHEDULED;
        self.timer.restart(start, self.delay, self.time);

        // If the elapsed delay is less than our first sleep, start immediately.
        if (self.delay <= elapsed) start(elapsed - self.delay);
      }

      function start(elapsed) {
        var i, j, n, o;

        // If the state is not SCHEDULED, then we previously errored on start.
        if (self.state !== SCHEDULED) return stop();

        for (i in schedules) {
          o = schedules[i];
          if (o.name !== self.name) continue;

          // While this element already has a starting transition during this frame,
          // defer starting an interrupting transition until that transition has a
          // chance to tick (and possibly end); see d3/d3-transition#54!
          if (o.state === STARTED) return timeout$1(start);

          // Interrupt the active transition, if any.
          if (o.state === RUNNING) {
            o.state = ENDED;
            o.timer.stop();
            o.on.call("interrupt", node, node.__data__, o.index, o.group);
            delete schedules[i];
          }

          // Cancel any pre-empted transitions.
          else if (+i < id) {
            o.state = ENDED;
            o.timer.stop();
            o.on.call("cancel", node, node.__data__, o.index, o.group);
            delete schedules[i];
          }
        }

        // Defer the first tick to end of the current frame; see d3/d3#1576.
        // Note the transition may be canceled after start and before the first tick!
        // Note this must be scheduled before the start event; see d3/d3-transition#16!
        // Assuming this is successful, subsequent callbacks go straight to tick.
        timeout$1(function() {
          if (self.state === STARTED) {
            self.state = RUNNING;
            self.timer.restart(tick, self.delay, self.time);
            tick(elapsed);
          }
        });

        // Dispatch the start event.
        // Note this must be done before the tween are initialized.
        self.state = STARTING;
        self.on.call("start", node, node.__data__, self.index, self.group);
        if (self.state !== STARTING) return; // interrupted
        self.state = STARTED;

        // Initialize the tween, deleting null tween.
        tween = new Array(n = self.tween.length);
        for (i = 0, j = -1; i < n; ++i) {
          if (o = self.tween[i].value.call(node, node.__data__, self.index, self.group)) {
            tween[++j] = o;
          }
        }
        tween.length = j + 1;
      }

      function tick(elapsed) {
        var t = elapsed < self.duration ? self.ease.call(null, elapsed / self.duration) : (self.timer.restart(stop), self.state = ENDING, 1),
            i = -1,
            n = tween.length;

        while (++i < n) {
          tween[i].call(node, t);
        }

        // Dispatch the end event.
        if (self.state === ENDING) {
          self.on.call("end", node, node.__data__, self.index, self.group);
          stop();
        }
      }

      function stop() {
        self.state = ENDED;
        self.timer.stop();
        delete schedules[id];
        for (var i in schedules) return; // eslint-disable-line no-unused-vars
        delete node.__transition;
      }
    }

    function interrupt(node, name) {
      var schedules = node.__transition,
          schedule,
          active,
          empty = true,
          i;

      if (!schedules) return;

      name = name == null ? null : name + "";

      for (i in schedules) {
        if ((schedule = schedules[i]).name !== name) { empty = false; continue; }
        active = schedule.state > STARTING && schedule.state < ENDING;
        schedule.state = ENDED;
        schedule.timer.stop();
        schedule.on.call(active ? "interrupt" : "cancel", node, node.__data__, schedule.index, schedule.group);
        delete schedules[i];
      }

      if (empty) delete node.__transition;
    }

    function selection_interrupt(name) {
      return this.each(function() {
        interrupt(this, name);
      });
    }

    function tweenRemove(id, name) {
      var tween0, tween1;
      return function() {
        var schedule = set$1(this, id),
            tween = schedule.tween;

        // If this node shared tween with the previous node,
        // just assign the updated shared tween and we’re done!
        // Otherwise, copy-on-write.
        if (tween !== tween0) {
          tween1 = tween0 = tween;
          for (var i = 0, n = tween1.length; i < n; ++i) {
            if (tween1[i].name === name) {
              tween1 = tween1.slice();
              tween1.splice(i, 1);
              break;
            }
          }
        }

        schedule.tween = tween1;
      };
    }

    function tweenFunction(id, name, value) {
      var tween0, tween1;
      if (typeof value !== "function") throw new Error;
      return function() {
        var schedule = set$1(this, id),
            tween = schedule.tween;

        // If this node shared tween with the previous node,
        // just assign the updated shared tween and we’re done!
        // Otherwise, copy-on-write.
        if (tween !== tween0) {
          tween1 = (tween0 = tween).slice();
          for (var t = {name: name, value: value}, i = 0, n = tween1.length; i < n; ++i) {
            if (tween1[i].name === name) {
              tween1[i] = t;
              break;
            }
          }
          if (i === n) tween1.push(t);
        }

        schedule.tween = tween1;
      };
    }

    function transition_tween(name, value) {
      var id = this._id;

      name += "";

      if (arguments.length < 2) {
        var tween = get$1(this.node(), id).tween;
        for (var i = 0, n = tween.length, t; i < n; ++i) {
          if ((t = tween[i]).name === name) {
            return t.value;
          }
        }
        return null;
      }

      return this.each((value == null ? tweenRemove : tweenFunction)(id, name, value));
    }

    function tweenValue(transition, name, value) {
      var id = transition._id;

      transition.each(function() {
        var schedule = set$1(this, id);
        (schedule.value || (schedule.value = {}))[name] = value.apply(this, arguments);
      });

      return function(node) {
        return get$1(node, id).value[name];
      };
    }

    function interpolate(a, b) {
      var c;
      return (typeof b === "number" ? interpolateNumber
          : b instanceof color ? interpolateRgb
          : (c = color(b)) ? (b = c, interpolateRgb)
          : interpolateString)(a, b);
    }

    function attrRemove$1(name) {
      return function() {
        this.removeAttribute(name);
      };
    }

    function attrRemoveNS$1(fullname) {
      return function() {
        this.removeAttributeNS(fullname.space, fullname.local);
      };
    }

    function attrConstant$1(name, interpolate, value1) {
      var string00,
          string1 = value1 + "",
          interpolate0;
      return function() {
        var string0 = this.getAttribute(name);
        return string0 === string1 ? null
            : string0 === string00 ? interpolate0
            : interpolate0 = interpolate(string00 = string0, value1);
      };
    }

    function attrConstantNS$1(fullname, interpolate, value1) {
      var string00,
          string1 = value1 + "",
          interpolate0;
      return function() {
        var string0 = this.getAttributeNS(fullname.space, fullname.local);
        return string0 === string1 ? null
            : string0 === string00 ? interpolate0
            : interpolate0 = interpolate(string00 = string0, value1);
      };
    }

    function attrFunction$1(name, interpolate, value) {
      var string00,
          string10,
          interpolate0;
      return function() {
        var string0, value1 = value(this), string1;
        if (value1 == null) return void this.removeAttribute(name);
        string0 = this.getAttribute(name);
        string1 = value1 + "";
        return string0 === string1 ? null
            : string0 === string00 && string1 === string10 ? interpolate0
            : (string10 = string1, interpolate0 = interpolate(string00 = string0, value1));
      };
    }

    function attrFunctionNS$1(fullname, interpolate, value) {
      var string00,
          string10,
          interpolate0;
      return function() {
        var string0, value1 = value(this), string1;
        if (value1 == null) return void this.removeAttributeNS(fullname.space, fullname.local);
        string0 = this.getAttributeNS(fullname.space, fullname.local);
        string1 = value1 + "";
        return string0 === string1 ? null
            : string0 === string00 && string1 === string10 ? interpolate0
            : (string10 = string1, interpolate0 = interpolate(string00 = string0, value1));
      };
    }

    function transition_attr(name, value) {
      var fullname = namespace(name), i = fullname === "transform" ? interpolateTransformSvg : interpolate;
      return this.attrTween(name, typeof value === "function"
          ? (fullname.local ? attrFunctionNS$1 : attrFunction$1)(fullname, i, tweenValue(this, "attr." + name, value))
          : value == null ? (fullname.local ? attrRemoveNS$1 : attrRemove$1)(fullname)
          : (fullname.local ? attrConstantNS$1 : attrConstant$1)(fullname, i, value));
    }

    function attrInterpolate(name, i) {
      return function(t) {
        this.setAttribute(name, i(t));
      };
    }

    function attrInterpolateNS(fullname, i) {
      return function(t) {
        this.setAttributeNS(fullname.space, fullname.local, i(t));
      };
    }

    function attrTweenNS(fullname, value) {
      var t0, i0;
      function tween() {
        var i = value.apply(this, arguments);
        if (i !== i0) t0 = (i0 = i) && attrInterpolateNS(fullname, i);
        return t0;
      }
      tween._value = value;
      return tween;
    }

    function attrTween(name, value) {
      var t0, i0;
      function tween() {
        var i = value.apply(this, arguments);
        if (i !== i0) t0 = (i0 = i) && attrInterpolate(name, i);
        return t0;
      }
      tween._value = value;
      return tween;
    }

    function transition_attrTween(name, value) {
      var key = "attr." + name;
      if (arguments.length < 2) return (key = this.tween(key)) && key._value;
      if (value == null) return this.tween(key, null);
      if (typeof value !== "function") throw new Error;
      var fullname = namespace(name);
      return this.tween(key, (fullname.local ? attrTweenNS : attrTween)(fullname, value));
    }

    function delayFunction(id, value) {
      return function() {
        init$1(this, id).delay = +value.apply(this, arguments);
      };
    }

    function delayConstant(id, value) {
      return value = +value, function() {
        init$1(this, id).delay = value;
      };
    }

    function transition_delay(value) {
      var id = this._id;

      return arguments.length
          ? this.each((typeof value === "function"
              ? delayFunction
              : delayConstant)(id, value))
          : get$1(this.node(), id).delay;
    }

    function durationFunction(id, value) {
      return function() {
        set$1(this, id).duration = +value.apply(this, arguments);
      };
    }

    function durationConstant(id, value) {
      return value = +value, function() {
        set$1(this, id).duration = value;
      };
    }

    function transition_duration(value) {
      var id = this._id;

      return arguments.length
          ? this.each((typeof value === "function"
              ? durationFunction
              : durationConstant)(id, value))
          : get$1(this.node(), id).duration;
    }

    function easeConstant(id, value) {
      if (typeof value !== "function") throw new Error;
      return function() {
        set$1(this, id).ease = value;
      };
    }

    function transition_ease(value) {
      var id = this._id;

      return arguments.length
          ? this.each(easeConstant(id, value))
          : get$1(this.node(), id).ease;
    }

    function transition_filter(match) {
      if (typeof match !== "function") match = matcher(match);

      for (var groups = this._groups, m = groups.length, subgroups = new Array(m), j = 0; j < m; ++j) {
        for (var group = groups[j], n = group.length, subgroup = subgroups[j] = [], node, i = 0; i < n; ++i) {
          if ((node = group[i]) && match.call(node, node.__data__, i, group)) {
            subgroup.push(node);
          }
        }
      }

      return new Transition(subgroups, this._parents, this._name, this._id);
    }

    function transition_merge(transition) {
      if (transition._id !== this._id) throw new Error;

      for (var groups0 = this._groups, groups1 = transition._groups, m0 = groups0.length, m1 = groups1.length, m = Math.min(m0, m1), merges = new Array(m0), j = 0; j < m; ++j) {
        for (var group0 = groups0[j], group1 = groups1[j], n = group0.length, merge = merges[j] = new Array(n), node, i = 0; i < n; ++i) {
          if (node = group0[i] || group1[i]) {
            merge[i] = node;
          }
        }
      }

      for (; j < m0; ++j) {
        merges[j] = groups0[j];
      }

      return new Transition(merges, this._parents, this._name, this._id);
    }

    function start(name) {
      return (name + "").trim().split(/^|\s+/).every(function(t) {
        var i = t.indexOf(".");
        if (i >= 0) t = t.slice(0, i);
        return !t || t === "start";
      });
    }

    function onFunction(id, name, listener) {
      var on0, on1, sit = start(name) ? init$1 : set$1;
      return function() {
        var schedule = sit(this, id),
            on = schedule.on;

        // If this node shared a dispatch with the previous node,
        // just assign the updated shared dispatch and we’re done!
        // Otherwise, copy-on-write.
        if (on !== on0) (on1 = (on0 = on).copy()).on(name, listener);

        schedule.on = on1;
      };
    }

    function transition_on(name, listener) {
      var id = this._id;

      return arguments.length < 2
          ? get$1(this.node(), id).on.on(name)
          : this.each(onFunction(id, name, listener));
    }

    function removeFunction(id) {
      return function() {
        var parent = this.parentNode;
        for (var i in this.__transition) if (+i !== id) return;
        if (parent) parent.removeChild(this);
      };
    }

    function transition_remove() {
      return this.on("end.remove", removeFunction(this._id));
    }

    function transition_select(select) {
      var name = this._name,
          id = this._id;

      if (typeof select !== "function") select = selector(select);

      for (var groups = this._groups, m = groups.length, subgroups = new Array(m), j = 0; j < m; ++j) {
        for (var group = groups[j], n = group.length, subgroup = subgroups[j] = new Array(n), node, subnode, i = 0; i < n; ++i) {
          if ((node = group[i]) && (subnode = select.call(node, node.__data__, i, group))) {
            if ("__data__" in node) subnode.__data__ = node.__data__;
            subgroup[i] = subnode;
            schedule(subgroup[i], name, id, i, subgroup, get$1(node, id));
          }
        }
      }

      return new Transition(subgroups, this._parents, name, id);
    }

    function transition_selectAll(select) {
      var name = this._name,
          id = this._id;

      if (typeof select !== "function") select = selectorAll(select);

      for (var groups = this._groups, m = groups.length, subgroups = [], parents = [], j = 0; j < m; ++j) {
        for (var group = groups[j], n = group.length, node, i = 0; i < n; ++i) {
          if (node = group[i]) {
            for (var children = select.call(node, node.__data__, i, group), child, inherit = get$1(node, id), k = 0, l = children.length; k < l; ++k) {
              if (child = children[k]) {
                schedule(child, name, id, k, children, inherit);
              }
            }
            subgroups.push(children);
            parents.push(node);
          }
        }
      }

      return new Transition(subgroups, parents, name, id);
    }

    var Selection$1 = selection.prototype.constructor;

    function transition_selection() {
      return new Selection$1(this._groups, this._parents);
    }

    function styleNull(name, interpolate) {
      var string00,
          string10,
          interpolate0;
      return function() {
        var string0 = styleValue(this, name),
            string1 = (this.style.removeProperty(name), styleValue(this, name));
        return string0 === string1 ? null
            : string0 === string00 && string1 === string10 ? interpolate0
            : interpolate0 = interpolate(string00 = string0, string10 = string1);
      };
    }

    function styleRemove$1(name) {
      return function() {
        this.style.removeProperty(name);
      };
    }

    function styleConstant$1(name, interpolate, value1) {
      var string00,
          string1 = value1 + "",
          interpolate0;
      return function() {
        var string0 = styleValue(this, name);
        return string0 === string1 ? null
            : string0 === string00 ? interpolate0
            : interpolate0 = interpolate(string00 = string0, value1);
      };
    }

    function styleFunction$1(name, interpolate, value) {
      var string00,
          string10,
          interpolate0;
      return function() {
        var string0 = styleValue(this, name),
            value1 = value(this),
            string1 = value1 + "";
        if (value1 == null) string1 = value1 = (this.style.removeProperty(name), styleValue(this, name));
        return string0 === string1 ? null
            : string0 === string00 && string1 === string10 ? interpolate0
            : (string10 = string1, interpolate0 = interpolate(string00 = string0, value1));
      };
    }

    function styleMaybeRemove(id, name) {
      var on0, on1, listener0, key = "style." + name, event = "end." + key, remove;
      return function() {
        var schedule = set$1(this, id),
            on = schedule.on,
            listener = schedule.value[key] == null ? remove || (remove = styleRemove$1(name)) : undefined;

        // If this node shared a dispatch with the previous node,
        // just assign the updated shared dispatch and we’re done!
        // Otherwise, copy-on-write.
        if (on !== on0 || listener0 !== listener) (on1 = (on0 = on).copy()).on(event, listener0 = listener);

        schedule.on = on1;
      };
    }

    function transition_style(name, value, priority) {
      var i = (name += "") === "transform" ? interpolateTransformCss : interpolate;
      return value == null ? this
          .styleTween(name, styleNull(name, i))
          .on("end.style." + name, styleRemove$1(name))
        : typeof value === "function" ? this
          .styleTween(name, styleFunction$1(name, i, tweenValue(this, "style." + name, value)))
          .each(styleMaybeRemove(this._id, name))
        : this
          .styleTween(name, styleConstant$1(name, i, value), priority)
          .on("end.style." + name, null);
    }

    function styleInterpolate(name, i, priority) {
      return function(t) {
        this.style.setProperty(name, i(t), priority);
      };
    }

    function styleTween(name, value, priority) {
      var t, i0;
      function tween() {
        var i = value.apply(this, arguments);
        if (i !== i0) t = (i0 = i) && styleInterpolate(name, i, priority);
        return t;
      }
      tween._value = value;
      return tween;
    }

    function transition_styleTween(name, value, priority) {
      var key = "style." + (name += "");
      if (arguments.length < 2) return (key = this.tween(key)) && key._value;
      if (value == null) return this.tween(key, null);
      if (typeof value !== "function") throw new Error;
      return this.tween(key, styleTween(name, value, priority == null ? "" : priority));
    }

    function textConstant$1(value) {
      return function() {
        this.textContent = value;
      };
    }

    function textFunction$1(value) {
      return function() {
        var value1 = value(this);
        this.textContent = value1 == null ? "" : value1;
      };
    }

    function transition_text(value) {
      return this.tween("text", typeof value === "function"
          ? textFunction$1(tweenValue(this, "text", value))
          : textConstant$1(value == null ? "" : value + ""));
    }

    function transition_transition() {
      var name = this._name,
          id0 = this._id,
          id1 = newId();

      for (var groups = this._groups, m = groups.length, j = 0; j < m; ++j) {
        for (var group = groups[j], n = group.length, node, i = 0; i < n; ++i) {
          if (node = group[i]) {
            var inherit = get$1(node, id0);
            schedule(node, name, id1, i, group, {
              time: inherit.time + inherit.delay + inherit.duration,
              delay: 0,
              duration: inherit.duration,
              ease: inherit.ease
            });
          }
        }
      }

      return new Transition(groups, this._parents, name, id1);
    }

    function transition_end() {
      var on0, on1, that = this, id = that._id, size = that.size();
      return new Promise(function(resolve, reject) {
        var cancel = {value: reject},
            end = {value: function() { if (--size === 0) resolve(); }};

        that.each(function() {
          var schedule = set$1(this, id),
              on = schedule.on;

          // If this node shared a dispatch with the previous node,
          // just assign the updated shared dispatch and we’re done!
          // Otherwise, copy-on-write.
          if (on !== on0) {
            on1 = (on0 = on).copy();
            on1._.cancel.push(cancel);
            on1._.interrupt.push(cancel);
            on1._.end.push(end);
          }

          schedule.on = on1;
        });
      });
    }

    var id = 0;

    function Transition(groups, parents, name, id) {
      this._groups = groups;
      this._parents = parents;
      this._name = name;
      this._id = id;
    }

    function transition(name) {
      return selection().transition(name);
    }

    function newId() {
      return ++id;
    }

    var selection_prototype = selection.prototype;

    Transition.prototype = transition.prototype = {
      constructor: Transition,
      select: transition_select,
      selectAll: transition_selectAll,
      filter: transition_filter,
      merge: transition_merge,
      selection: transition_selection,
      transition: transition_transition,
      call: selection_prototype.call,
      nodes: selection_prototype.nodes,
      node: selection_prototype.node,
      size: selection_prototype.size,
      empty: selection_prototype.empty,
      each: selection_prototype.each,
      on: transition_on,
      attr: transition_attr,
      attrTween: transition_attrTween,
      style: transition_style,
      styleTween: transition_styleTween,
      text: transition_text,
      remove: transition_remove,
      tween: transition_tween,
      delay: transition_delay,
      duration: transition_duration,
      ease: transition_ease,
      end: transition_end
    };

    function cubicInOut(t) {
      return ((t *= 2) <= 1 ? t * t * t : (t -= 2) * t * t + 2) / 2;
    }

    var pi = Math.PI;

    var tau = 2 * Math.PI;

    var defaultTiming = {
      time: null, // Set on use.
      delay: 0,
      duration: 250,
      ease: cubicInOut
    };

    function inherit(node, id) {
      var timing;
      while (!(timing = node.__transition) || !(timing = timing[id])) {
        if (!(node = node.parentNode)) {
          return defaultTiming.time = now$1(), defaultTiming;
        }
      }
      return timing;
    }

    function selection_transition(name) {
      var id,
          timing;

      if (name instanceof Transition) {
        id = name._id, name = name._name;
      } else {
        id = newId(), (timing = defaultTiming).time = now$1(), name = name == null ? null : name + "";
      }

      for (var groups = this._groups, m = groups.length, j = 0; j < m; ++j) {
        for (var group = groups[j], n = group.length, node, i = 0; i < n; ++i) {
          if (node = group[i]) {
            schedule(node, name, id, i, group, timing || inherit(node, id));
          }
        }
      }

      return new Transition(groups, this._parents, name, id);
    }

    selection.prototype.interrupt = selection_interrupt;
    selection.prototype.transition = selection_transition;

    function constant$2(x) {
      return function() {
        return x;
      };
    }

    function BrushEvent(target, type, selection) {
      this.target = target;
      this.type = type;
      this.selection = selection;
    }

    function nopropagation() {
      event.stopImmediatePropagation();
    }

    function noevent$1() {
      event.preventDefault();
      event.stopImmediatePropagation();
    }

    var MODE_DRAG = {name: "drag"},
        MODE_SPACE = {name: "space"},
        MODE_HANDLE = {name: "handle"},
        MODE_CENTER = {name: "center"};

    var X = {
      name: "x",
      handles: ["e", "w"].map(type),
      input: function(x, e) { return x && [[x[0], e[0][1]], [x[1], e[1][1]]]; },
      output: function(xy) { return xy && [xy[0][0], xy[1][0]]; }
    };

    var Y = {
      name: "y",
      handles: ["n", "s"].map(type),
      input: function(y, e) { return y && [[e[0][0], y[0]], [e[1][0], y[1]]]; },
      output: function(xy) { return xy && [xy[0][1], xy[1][1]]; }
    };

    var cursors = {
      overlay: "crosshair",
      selection: "move",
      n: "ns-resize",
      e: "ew-resize",
      s: "ns-resize",
      w: "ew-resize",
      nw: "nwse-resize",
      ne: "nesw-resize",
      se: "nwse-resize",
      sw: "nesw-resize"
    };

    var flipX = {
      e: "w",
      w: "e",
      nw: "ne",
      ne: "nw",
      se: "sw",
      sw: "se"
    };

    var flipY = {
      n: "s",
      s: "n",
      nw: "sw",
      ne: "se",
      se: "ne",
      sw: "nw"
    };

    var signsX = {
      overlay: +1,
      selection: +1,
      n: null,
      e: +1,
      s: null,
      w: -1,
      nw: -1,
      ne: +1,
      se: +1,
      sw: -1
    };

    var signsY = {
      overlay: +1,
      selection: +1,
      n: -1,
      e: null,
      s: +1,
      w: null,
      nw: -1,
      ne: -1,
      se: +1,
      sw: +1
    };

    function type(t) {
      return {type: t};
    }

    // Ignore right-click, since that should open the context menu.
    function defaultFilter() {
      return !event.button;
    }

    function defaultExtent() {
      var svg = this.ownerSVGElement || this;
      return [[0, 0], [svg.width.baseVal.value, svg.height.baseVal.value]];
    }

    // Like d3.local, but with the name “__brush” rather than auto-generated.
    function local(node) {
      while (!node.__brush) if (!(node = node.parentNode)) return;
      return node.__brush;
    }

    function empty$2(extent) {
      return extent[0][0] === extent[1][0]
          || extent[0][1] === extent[1][1];
    }

    function brushX() {
      return brush(X);
    }

    function brush(dim) {
      var extent = defaultExtent,
          filter = defaultFilter,
          listeners = dispatch$1(brush, "start", "brush", "end"),
          handleSize = 6,
          touchending;

      function brush(group) {
        var overlay = group
            .property("__brush", initialize)
          .selectAll(".overlay")
          .data([type("overlay")]);

        overlay.enter().append("rect")
            .attr("class", "overlay")
            .attr("pointer-events", "all")
            .attr("cursor", cursors.overlay)
          .merge(overlay)
            .each(function() {
              var extent = local(this).extent;
              d3select(this)
                  .attr("x", extent[0][0])
                  .attr("y", extent[0][1])
                  .attr("width", extent[1][0] - extent[0][0])
                  .attr("height", extent[1][1] - extent[0][1]);
            });

        group.selectAll(".selection")
          .data([type("selection")])
          .enter().append("rect")
            .attr("class", "selection")
            .attr("cursor", cursors.selection)
            .attr("fill", "#777")
            .attr("fill-opacity", 0.3)
            .attr("stroke", "#fff")
            .attr("shape-rendering", "crispEdges");

        var handle = group.selectAll(".handle")
          .data(dim.handles, function(d) { return d.type; });

        handle.exit().remove();

        handle.enter().append("rect")
            .attr("class", function(d) { return "handle handle--" + d.type; })
            .attr("cursor", function(d) { return cursors[d.type]; });

        group
            .each(redraw)
            .attr("fill", "none")
            .attr("pointer-events", "all")
            .style("-webkit-tap-highlight-color", "rgba(0,0,0,0)")
            .on("mousedown.brush touchstart.brush", started);
      }

      brush.move = function(group, selection) {
        if (group.selection) {
          group
              .on("start.brush", function() { emitter(this, arguments).beforestart().start(); })
              .on("interrupt.brush end.brush", function() { emitter(this, arguments).end(); })
              .tween("brush", function() {
                var that = this,
                    state = that.__brush,
                    emit = emitter(that, arguments),
                    selection0 = state.selection,
                    selection1 = dim.input(typeof selection === "function" ? selection.apply(this, arguments) : selection, state.extent),
                    i = interpolateValue(selection0, selection1);

                function tween(t) {
                  state.selection = t === 1 && empty$2(selection1) ? null : i(t);
                  redraw.call(that);
                  emit.brush();
                }

                return selection0 && selection1 ? tween : tween(1);
              });
        } else {
          group
              .each(function() {
                var that = this,
                    args = arguments,
                    state = that.__brush,
                    selection1 = dim.input(typeof selection === "function" ? selection.apply(that, args) : selection, state.extent),
                    emit = emitter(that, args).beforestart();

                interrupt(that);
                state.selection = selection1 == null || empty$2(selection1) ? null : selection1;
                redraw.call(that);
                emit.start().brush().end();
              });
        }
      };

      function redraw() {
        var group = d3select(this),
            selection = local(this).selection;

        if (selection) {
          group.selectAll(".selection")
              .style("display", null)
              .attr("x", selection[0][0])
              .attr("y", selection[0][1])
              .attr("width", selection[1][0] - selection[0][0])
              .attr("height", selection[1][1] - selection[0][1]);

          group.selectAll(".handle")
              .style("display", null)
              .attr("x", function(d) { return d.type[d.type.length - 1] === "e" ? selection[1][0] - handleSize / 2 : selection[0][0] - handleSize / 2; })
              .attr("y", function(d) { return d.type[0] === "s" ? selection[1][1] - handleSize / 2 : selection[0][1] - handleSize / 2; })
              .attr("width", function(d) { return d.type === "n" || d.type === "s" ? selection[1][0] - selection[0][0] + handleSize : handleSize; })
              .attr("height", function(d) { return d.type === "e" || d.type === "w" ? selection[1][1] - selection[0][1] + handleSize : handleSize; });
        }

        else {
          group.selectAll(".selection,.handle")
              .style("display", "none")
              .attr("x", null)
              .attr("y", null)
              .attr("width", null)
              .attr("height", null);
        }
      }

      function emitter(that, args) {
        return that.__brush.emitter || new Emitter(that, args);
      }

      function Emitter(that, args) {
        this.that = that;
        this.args = args;
        this.state = that.__brush;
        this.active = 0;
      }

      Emitter.prototype = {
        beforestart: function() {
          if (++this.active === 1) this.state.emitter = this, this.starting = true;
          return this;
        },
        start: function() {
          if (this.starting) this.starting = false, this.emit("start");
          return this;
        },
        brush: function() {
          this.emit("brush");
          return this;
        },
        end: function() {
          if (--this.active === 0) delete this.state.emitter, this.emit("end");
          return this;
        },
        emit: function(type) {
          customEvent(new BrushEvent(brush, type, dim.output(this.state.selection)), listeners.apply, listeners, [type, this.that, this.args]);
        }
      };

      function started() {
        if (event.touches) { if (event.changedTouches.length < event.touches.length) return noevent$1(); }
        else if (touchending) return;
        if (!filter.apply(this, arguments)) return;

        var that = this,
            type = event.target.__data__.type,
            mode = (event.metaKey ? type = "overlay" : type) === "selection" ? MODE_DRAG : (event.altKey ? MODE_CENTER : MODE_HANDLE),
            signX = dim === Y ? null : signsX[type],
            signY = dim === X ? null : signsY[type],
            state = local(that),
            extent = state.extent,
            selection = state.selection,
            W = extent[0][0], w0, w1,
            N = extent[0][1], n0, n1,
            E = extent[1][0], e0, e1,
            S = extent[1][1], s0, s1,
            dx,
            dy,
            moving,
            shifting = signX && signY && event.shiftKey,
            lockX,
            lockY,
            point0 = mouse(that),
            point = point0,
            emit = emitter(that, arguments).beforestart();

        if (type === "overlay") {
          state.selection = selection = [
            [w0 = dim === Y ? W : point0[0], n0 = dim === X ? N : point0[1]],
            [e0 = dim === Y ? E : w0, s0 = dim === X ? S : n0]
          ];
        } else {
          w0 = selection[0][0];
          n0 = selection[0][1];
          e0 = selection[1][0];
          s0 = selection[1][1];
        }

        w1 = w0;
        n1 = n0;
        e1 = e0;
        s1 = s0;

        var group = d3select(that)
            .attr("pointer-events", "none");

        var overlay = group.selectAll(".overlay")
            .attr("cursor", cursors[type]);

        if (event.touches) {
          group
              .on("touchmove.brush", moved, true)
              .on("touchend.brush touchcancel.brush", ended, true);
        } else {
          var view = d3select(event.view)
              .on("keydown.brush", keydowned, true)
              .on("keyup.brush", keyupped, true)
              .on("mousemove.brush", moved, true)
              .on("mouseup.brush", ended, true);

          dragDisable(event.view);
        }

        nopropagation();
        interrupt(that);
        redraw.call(that);
        emit.start();

        function moved() {
          var point1 = mouse(that);
          if (shifting && !lockX && !lockY) {
            if (Math.abs(point1[0] - point[0]) > Math.abs(point1[1] - point[1])) lockY = true;
            else lockX = true;
          }
          point = point1;
          moving = true;
          noevent$1();
          move();
        }

        function move() {
          var t;

          dx = point[0] - point0[0];
          dy = point[1] - point0[1];

          switch (mode) {
            case MODE_SPACE:
            case MODE_DRAG: {
              if (signX) dx = Math.max(W - w0, Math.min(E - e0, dx)), w1 = w0 + dx, e1 = e0 + dx;
              if (signY) dy = Math.max(N - n0, Math.min(S - s0, dy)), n1 = n0 + dy, s1 = s0 + dy;
              break;
            }
            case MODE_HANDLE: {
              if (signX < 0) dx = Math.max(W - w0, Math.min(E - w0, dx)), w1 = w0 + dx, e1 = e0;
              else if (signX > 0) dx = Math.max(W - e0, Math.min(E - e0, dx)), w1 = w0, e1 = e0 + dx;
              if (signY < 0) dy = Math.max(N - n0, Math.min(S - n0, dy)), n1 = n0 + dy, s1 = s0;
              else if (signY > 0) dy = Math.max(N - s0, Math.min(S - s0, dy)), n1 = n0, s1 = s0 + dy;
              break;
            }
            case MODE_CENTER: {
              if (signX) w1 = Math.max(W, Math.min(E, w0 - dx * signX)), e1 = Math.max(W, Math.min(E, e0 + dx * signX));
              if (signY) n1 = Math.max(N, Math.min(S, n0 - dy * signY)), s1 = Math.max(N, Math.min(S, s0 + dy * signY));
              break;
            }
          }

          if (e1 < w1) {
            signX *= -1;
            t = w0, w0 = e0, e0 = t;
            t = w1, w1 = e1, e1 = t;
            if (type in flipX) overlay.attr("cursor", cursors[type = flipX[type]]);
          }

          if (s1 < n1) {
            signY *= -1;
            t = n0, n0 = s0, s0 = t;
            t = n1, n1 = s1, s1 = t;
            if (type in flipY) overlay.attr("cursor", cursors[type = flipY[type]]);
          }

          if (state.selection) selection = state.selection; // May be set by brush.move!
          if (lockX) w1 = selection[0][0], e1 = selection[1][0];
          if (lockY) n1 = selection[0][1], s1 = selection[1][1];

          if (selection[0][0] !== w1
              || selection[0][1] !== n1
              || selection[1][0] !== e1
              || selection[1][1] !== s1) {
            state.selection = [[w1, n1], [e1, s1]];
            redraw.call(that);
            emit.brush();
          }
        }

        function ended() {
          nopropagation();
          if (event.touches) {
            if (event.touches.length) return;
            if (touchending) clearTimeout(touchending);
            touchending = setTimeout(function() { touchending = null; }, 500); // Ghost clicks are delayed!
            group.on("touchmove.brush touchend.brush touchcancel.brush", null);
          } else {
            yesdrag(event.view, moving);
            view.on("keydown.brush keyup.brush mousemove.brush mouseup.brush", null);
          }
          group.attr("pointer-events", "all");
          overlay.attr("cursor", cursors.overlay);
          if (state.selection) selection = state.selection; // May be set by brush.move (on start)!
          if (empty$2(selection)) state.selection = null, redraw.call(that);
          emit.end();
        }

        function keydowned() {
          switch (event.keyCode) {
            case 16: { // SHIFT
              shifting = signX && signY;
              break;
            }
            case 18: { // ALT
              if (mode === MODE_HANDLE) {
                if (signX) e0 = e1 - dx * signX, w0 = w1 + dx * signX;
                if (signY) s0 = s1 - dy * signY, n0 = n1 + dy * signY;
                mode = MODE_CENTER;
                move();
              }
              break;
            }
            case 32: { // SPACE; takes priority over ALT
              if (mode === MODE_HANDLE || mode === MODE_CENTER) {
                if (signX < 0) e0 = e1 - dx; else if (signX > 0) w0 = w1 - dx;
                if (signY < 0) s0 = s1 - dy; else if (signY > 0) n0 = n1 - dy;
                mode = MODE_SPACE;
                overlay.attr("cursor", cursors.selection);
                move();
              }
              break;
            }
            default: return;
          }
          noevent$1();
        }

        function keyupped() {
          switch (event.keyCode) {
            case 16: { // SHIFT
              if (shifting) {
                lockX = lockY = shifting = false;
                move();
              }
              break;
            }
            case 18: { // ALT
              if (mode === MODE_CENTER) {
                if (signX < 0) e0 = e1; else if (signX > 0) w0 = w1;
                if (signY < 0) s0 = s1; else if (signY > 0) n0 = n1;
                mode = MODE_HANDLE;
                move();
              }
              break;
            }
            case 32: { // SPACE
              if (mode === MODE_SPACE) {
                if (event.altKey) {
                  if (signX) e0 = e1 - dx * signX, w0 = w1 + dx * signX;
                  if (signY) s0 = s1 - dy * signY, n0 = n1 + dy * signY;
                  mode = MODE_CENTER;
                } else {
                  if (signX < 0) e0 = e1; else if (signX > 0) w0 = w1;
                  if (signY < 0) s0 = s1; else if (signY > 0) n0 = n1;
                  mode = MODE_HANDLE;
                }
                overlay.attr("cursor", cursors[type]);
                move();
              }
              break;
            }
            default: return;
          }
          noevent$1();
        }
      }

      function initialize() {
        var state = this.__brush || {selection: null};
        state.extent = extent.apply(this, arguments);
        state.dim = dim;
        return state;
      }

      brush.extent = function(_) {
        return arguments.length ? (extent = typeof _ === "function" ? _ : constant$2([[+_[0][0], +_[0][1]], [+_[1][0], +_[1][1]]]), brush) : extent;
      };

      brush.filter = function(_) {
        return arguments.length ? (filter = typeof _ === "function" ? _ : constant$2(!!_), brush) : filter;
      };

      brush.handleSize = function(_) {
        return arguments.length ? (handleSize = +_, brush) : handleSize;
      };

      brush.on = function() {
        var value = listeners.on.apply(listeners, arguments);
        return value === listeners ? brush : value;
      };

      return brush;
    }

    var pi$1 = Math.PI;

    var pi$2 = Math.PI,
        tau$1 = 2 * pi$2,
        epsilon = 1e-6,
        tauEpsilon = tau$1 - epsilon;

    function Path() {
      this._x0 = this._y0 = // start of current subpath
      this._x1 = this._y1 = null; // end of current subpath
      this._ = "";
    }

    function path() {
      return new Path;
    }

    Path.prototype = path.prototype = {
      constructor: Path,
      moveTo: function(x, y) {
        this._ += "M" + (this._x0 = this._x1 = +x) + "," + (this._y0 = this._y1 = +y);
      },
      closePath: function() {
        if (this._x1 !== null) {
          this._x1 = this._x0, this._y1 = this._y0;
          this._ += "Z";
        }
      },
      lineTo: function(x, y) {
        this._ += "L" + (this._x1 = +x) + "," + (this._y1 = +y);
      },
      quadraticCurveTo: function(x1, y1, x, y) {
        this._ += "Q" + (+x1) + "," + (+y1) + "," + (this._x1 = +x) + "," + (this._y1 = +y);
      },
      bezierCurveTo: function(x1, y1, x2, y2, x, y) {
        this._ += "C" + (+x1) + "," + (+y1) + "," + (+x2) + "," + (+y2) + "," + (this._x1 = +x) + "," + (this._y1 = +y);
      },
      arcTo: function(x1, y1, x2, y2, r) {
        x1 = +x1, y1 = +y1, x2 = +x2, y2 = +y2, r = +r;
        var x0 = this._x1,
            y0 = this._y1,
            x21 = x2 - x1,
            y21 = y2 - y1,
            x01 = x0 - x1,
            y01 = y0 - y1,
            l01_2 = x01 * x01 + y01 * y01;

        // Is the radius negative? Error.
        if (r < 0) throw new Error("negative radius: " + r);

        // Is this path empty? Move to (x1,y1).
        if (this._x1 === null) {
          this._ += "M" + (this._x1 = x1) + "," + (this._y1 = y1);
        }

        // Or, is (x1,y1) coincident with (x0,y0)? Do nothing.
        else if (!(l01_2 > epsilon));

        // Or, are (x0,y0), (x1,y1) and (x2,y2) collinear?
        // Equivalently, is (x1,y1) coincident with (x2,y2)?
        // Or, is the radius zero? Line to (x1,y1).
        else if (!(Math.abs(y01 * x21 - y21 * x01) > epsilon) || !r) {
          this._ += "L" + (this._x1 = x1) + "," + (this._y1 = y1);
        }

        // Otherwise, draw an arc!
        else {
          var x20 = x2 - x0,
              y20 = y2 - y0,
              l21_2 = x21 * x21 + y21 * y21,
              l20_2 = x20 * x20 + y20 * y20,
              l21 = Math.sqrt(l21_2),
              l01 = Math.sqrt(l01_2),
              l = r * Math.tan((pi$2 - Math.acos((l21_2 + l01_2 - l20_2) / (2 * l21 * l01))) / 2),
              t01 = l / l01,
              t21 = l / l21;

          // If the start tangent is not coincident with (x0,y0), line to.
          if (Math.abs(t01 - 1) > epsilon) {
            this._ += "L" + (x1 + t01 * x01) + "," + (y1 + t01 * y01);
          }

          this._ += "A" + r + "," + r + ",0,0," + (+(y01 * x20 > x01 * y20)) + "," + (this._x1 = x1 + t21 * x21) + "," + (this._y1 = y1 + t21 * y21);
        }
      },
      arc: function(x, y, r, a0, a1, ccw) {
        x = +x, y = +y, r = +r;
        var dx = r * Math.cos(a0),
            dy = r * Math.sin(a0),
            x0 = x + dx,
            y0 = y + dy,
            cw = 1 ^ ccw,
            da = ccw ? a0 - a1 : a1 - a0;

        // Is the radius negative? Error.
        if (r < 0) throw new Error("negative radius: " + r);

        // Is this path empty? Move to (x0,y0).
        if (this._x1 === null) {
          this._ += "M" + x0 + "," + y0;
        }

        // Or, is (x0,y0) not coincident with the previous point? Line to (x0,y0).
        else if (Math.abs(this._x1 - x0) > epsilon || Math.abs(this._y1 - y0) > epsilon) {
          this._ += "L" + x0 + "," + y0;
        }

        // Is this arc empty? We’re done.
        if (!r) return;

        // Does the angle go the wrong way? Flip the direction.
        if (da < 0) da = da % tau$1 + tau$1;

        // Is this a complete circle? Draw two arcs to complete the circle.
        if (da > tauEpsilon) {
          this._ += "A" + r + "," + r + ",0,1," + cw + "," + (x - dx) + "," + (y - dy) + "A" + r + "," + r + ",0,1," + cw + "," + (this._x1 = x0) + "," + (this._y1 = y0);
        }

        // Is this arc non-empty? Draw an arc!
        else if (da > epsilon) {
          this._ += "A" + r + "," + r + ",0," + (+(da >= pi$2)) + "," + cw + "," + (this._x1 = x + r * Math.cos(a1)) + "," + (this._y1 = y + r * Math.sin(a1));
        }
      },
      rect: function(x, y, w, h) {
        this._ += "M" + (this._x0 = this._x1 = +x) + "," + (this._y0 = this._y1 = +y) + "h" + (+w) + "v" + (+h) + "h" + (-w) + "Z";
      },
      toString: function() {
        return this._;
      }
    };

    var prefix = "$";

    function Map$1() {}

    Map$1.prototype = map.prototype = {
      constructor: Map$1,
      has: function(key) {
        return (prefix + key) in this;
      },
      get: function(key) {
        return this[prefix + key];
      },
      set: function(key, value) {
        this[prefix + key] = value;
        return this;
      },
      remove: function(key) {
        var property = prefix + key;
        return property in this && delete this[property];
      },
      clear: function() {
        for (var property in this) if (property[0] === prefix) delete this[property];
      },
      keys: function() {
        var keys = [];
        for (var property in this) if (property[0] === prefix) keys.push(property.slice(1));
        return keys;
      },
      values: function() {
        var values = [];
        for (var property in this) if (property[0] === prefix) values.push(this[property]);
        return values;
      },
      entries: function() {
        var entries = [];
        for (var property in this) if (property[0] === prefix) entries.push({key: property.slice(1), value: this[property]});
        return entries;
      },
      size: function() {
        var size = 0;
        for (var property in this) if (property[0] === prefix) ++size;
        return size;
      },
      empty: function() {
        for (var property in this) if (property[0] === prefix) return false;
        return true;
      },
      each: function(f) {
        for (var property in this) if (property[0] === prefix) f(this[property], property.slice(1), this);
      }
    };

    function map(object, f) {
      var map = new Map$1;

      // Copy constructor.
      if (object instanceof Map$1) object.each(function(value, key) { map.set(key, value); });

      // Index array by numeric index or specified key function.
      else if (Array.isArray(object)) {
        var i = -1,
            n = object.length,
            o;

        if (f == null) while (++i < n) map.set(i, object[i]);
        else while (++i < n) map.set(f(o = object[i], i, object), o);
      }

      // Convert object to map.
      else if (object) for (var key in object) map.set(key, object[key]);

      return map;
    }

    function nest() {
      var keys = [],
          sortKeys = [],
          sortValues,
          rollup,
          nest;

      function apply(array, depth, createResult, setResult) {
        if (depth >= keys.length) {
          if (sortValues != null) array.sort(sortValues);
          return rollup != null ? rollup(array) : array;
        }

        var i = -1,
            n = array.length,
            key = keys[depth++],
            keyValue,
            value,
            valuesByKey = map(),
            values,
            result = createResult();

        while (++i < n) {
          if (values = valuesByKey.get(keyValue = key(value = array[i]) + "")) {
            values.push(value);
          } else {
            valuesByKey.set(keyValue, [value]);
          }
        }

        valuesByKey.each(function(values, key) {
          setResult(result, key, apply(values, depth, createResult, setResult));
        });

        return result;
      }

      function entries(map, depth) {
        if (++depth > keys.length) return map;
        var array, sortKey = sortKeys[depth - 1];
        if (rollup != null && depth >= keys.length) array = map.entries();
        else array = [], map.each(function(v, k) { array.push({key: k, values: entries(v, depth)}); });
        return sortKey != null ? array.sort(function(a, b) { return sortKey(a.key, b.key); }) : array;
      }

      return nest = {
        object: function(array) { return apply(array, 0, createObject, setObject); },
        map: function(array) { return apply(array, 0, createMap, setMap); },
        entries: function(array) { return entries(apply(array, 0, createMap, setMap), 0); },
        key: function(d) { keys.push(d); return nest; },
        sortKeys: function(order) { sortKeys[keys.length - 1] = order; return nest; },
        sortValues: function(order) { sortValues = order; return nest; },
        rollup: function(f) { rollup = f; return nest; }
      };
    }

    function createObject() {
      return {};
    }

    function setObject(object, key, value) {
      object[key] = value;
    }

    function createMap() {
      return map();
    }

    function setMap(map, key, value) {
      map.set(key, value);
    }

    function Set$1() {}

    var proto = map.prototype;

    Set$1.prototype = set$2.prototype = {
      constructor: Set$1,
      has: proto.has,
      add: function(value) {
        value += "";
        this[prefix + value] = value;
        return this;
      },
      remove: proto.remove,
      clear: proto.clear,
      values: proto.keys,
      size: proto.size,
      empty: proto.empty,
      each: proto.each
    };

    function set$2(object, f) {
      var set = new Set$1;

      // Copy constructor.
      if (object instanceof Set$1) object.each(function(value) { set.add(value); });

      // Otherwise, assume it’s an array.
      else if (object) {
        var i = -1, n = object.length;
        if (f == null) while (++i < n) set.add(object[i]);
        else while (++i < n) set.add(f(object[i], i, object));
      }

      return set;
    }

    var EOL = {},
        EOF = {},
        QUOTE = 34,
        NEWLINE = 10,
        RETURN = 13;

    function objectConverter(columns) {
      return new Function("d", "return {" + columns.map(function(name, i) {
        return JSON.stringify(name) + ": d[" + i + "]";
      }).join(",") + "}");
    }

    function customConverter(columns, f) {
      var object = objectConverter(columns);
      return function(row, i) {
        return f(object(row), i, columns);
      };
    }

    // Compute unique columns in order of discovery.
    function inferColumns(rows) {
      var columnSet = Object.create(null),
          columns = [];

      rows.forEach(function(row) {
        for (var column in row) {
          if (!(column in columnSet)) {
            columns.push(columnSet[column] = column);
          }
        }
      });

      return columns;
    }

    function pad(value, width) {
      var s = value + "", length = s.length;
      return length < width ? new Array(width - length + 1).join(0) + s : s;
    }

    function formatYear(year) {
      return year < 0 ? "-" + pad(-year, 6)
        : year > 9999 ? "+" + pad(year, 6)
        : pad(year, 4);
    }

    function formatDate(date) {
      var hours = date.getUTCHours(),
          minutes = date.getUTCMinutes(),
          seconds = date.getUTCSeconds(),
          milliseconds = date.getUTCMilliseconds();
      return isNaN(date) ? "Invalid Date"
          : formatYear(date.getUTCFullYear()) + "-" + pad(date.getUTCMonth() + 1, 2) + "-" + pad(date.getUTCDate(), 2)
          + (milliseconds ? "T" + pad(hours, 2) + ":" + pad(minutes, 2) + ":" + pad(seconds, 2) + "." + pad(milliseconds, 3) + "Z"
          : seconds ? "T" + pad(hours, 2) + ":" + pad(minutes, 2) + ":" + pad(seconds, 2) + "Z"
          : minutes || hours ? "T" + pad(hours, 2) + ":" + pad(minutes, 2) + "Z"
          : "");
    }

    function dsvFormat(delimiter) {
      var reFormat = new RegExp("[\"" + delimiter + "\n\r]"),
          DELIMITER = delimiter.charCodeAt(0);

      function parse(text, f) {
        var convert, columns, rows = parseRows(text, function(row, i) {
          if (convert) return convert(row, i - 1);
          columns = row, convert = f ? customConverter(row, f) : objectConverter(row);
        });
        rows.columns = columns || [];
        return rows;
      }

      function parseRows(text, f) {
        var rows = [], // output rows
            N = text.length,
            I = 0, // current character index
            n = 0, // current line number
            t, // current token
            eof = N <= 0, // current token followed by EOF?
            eol = false; // current token followed by EOL?

        // Strip the trailing newline.
        if (text.charCodeAt(N - 1) === NEWLINE) --N;
        if (text.charCodeAt(N - 1) === RETURN) --N;

        function token() {
          if (eof) return EOF;
          if (eol) return eol = false, EOL;

          // Unescape quotes.
          var i, j = I, c;
          if (text.charCodeAt(j) === QUOTE) {
            while (I++ < N && text.charCodeAt(I) !== QUOTE || text.charCodeAt(++I) === QUOTE);
            if ((i = I) >= N) eof = true;
            else if ((c = text.charCodeAt(I++)) === NEWLINE) eol = true;
            else if (c === RETURN) { eol = true; if (text.charCodeAt(I) === NEWLINE) ++I; }
            return text.slice(j + 1, i - 1).replace(/""/g, "\"");
          }

          // Find next delimiter or newline.
          while (I < N) {
            if ((c = text.charCodeAt(i = I++)) === NEWLINE) eol = true;
            else if (c === RETURN) { eol = true; if (text.charCodeAt(I) === NEWLINE) ++I; }
            else if (c !== DELIMITER) continue;
            return text.slice(j, i);
          }

          // Return last token before EOF.
          return eof = true, text.slice(j, N);
        }

        while ((t = token()) !== EOF) {
          var row = [];
          while (t !== EOL && t !== EOF) row.push(t), t = token();
          if (f && (row = f(row, n++)) == null) continue;
          rows.push(row);
        }

        return rows;
      }

      function preformatBody(rows, columns) {
        return rows.map(function(row) {
          return columns.map(function(column) {
            return formatValue(row[column]);
          }).join(delimiter);
        });
      }

      function format(rows, columns) {
        if (columns == null) columns = inferColumns(rows);
        return [columns.map(formatValue).join(delimiter)].concat(preformatBody(rows, columns)).join("\n");
      }

      function formatBody(rows, columns) {
        if (columns == null) columns = inferColumns(rows);
        return preformatBody(rows, columns).join("\n");
      }

      function formatRows(rows) {
        return rows.map(formatRow).join("\n");
      }

      function formatRow(row) {
        return row.map(formatValue).join(delimiter);
      }

      function formatValue(value) {
        return value == null ? ""
            : value instanceof Date ? formatDate(value)
            : reFormat.test(value += "") ? "\"" + value.replace(/"/g, "\"\"") + "\""
            : value;
      }

      return {
        parse: parse,
        parseRows: parseRows,
        format: format,
        formatBody: formatBody,
        formatRows: formatRows
      };
    }

    var csv = dsvFormat(",");

    var csvParse = csv.parse;

    var tsv = dsvFormat("\t");

    function responseText(response) {
      if (!response.ok) throw new Error(response.status + " " + response.statusText);
      return response.text();
    }

    function text$1(input, init) {
      return fetch(input, init).then(responseText);
    }

    function dsvParse(parse) {
      return function(input, init, row) {
        if (arguments.length === 2 && typeof init === "function") row = init, init = undefined;
        return text$1(input, init).then(function(response) {
          return parse(response, row);
        });
      };
    }

    var csv$1 = dsvParse(csvParse);

    function tree_add(d) {
      var x = +this._x.call(null, d),
          y = +this._y.call(null, d);
      return add(this.cover(x, y), x, y, d);
    }

    function add(tree, x, y, d) {
      if (isNaN(x) || isNaN(y)) return tree; // ignore invalid points

      var parent,
          node = tree._root,
          leaf = {data: d},
          x0 = tree._x0,
          y0 = tree._y0,
          x1 = tree._x1,
          y1 = tree._y1,
          xm,
          ym,
          xp,
          yp,
          right,
          bottom,
          i,
          j;

      // If the tree is empty, initialize the root as a leaf.
      if (!node) return tree._root = leaf, tree;

      // Find the existing leaf for the new point, or add it.
      while (node.length) {
        if (right = x >= (xm = (x0 + x1) / 2)) x0 = xm; else x1 = xm;
        if (bottom = y >= (ym = (y0 + y1) / 2)) y0 = ym; else y1 = ym;
        if (parent = node, !(node = node[i = bottom << 1 | right])) return parent[i] = leaf, tree;
      }

      // Is the new point is exactly coincident with the existing point?
      xp = +tree._x.call(null, node.data);
      yp = +tree._y.call(null, node.data);
      if (x === xp && y === yp) return leaf.next = node, parent ? parent[i] = leaf : tree._root = leaf, tree;

      // Otherwise, split the leaf node until the old and new point are separated.
      do {
        parent = parent ? parent[i] = new Array(4) : tree._root = new Array(4);
        if (right = x >= (xm = (x0 + x1) / 2)) x0 = xm; else x1 = xm;
        if (bottom = y >= (ym = (y0 + y1) / 2)) y0 = ym; else y1 = ym;
      } while ((i = bottom << 1 | right) === (j = (yp >= ym) << 1 | (xp >= xm)));
      return parent[j] = node, parent[i] = leaf, tree;
    }

    function addAll(data) {
      var d, i, n = data.length,
          x,
          y,
          xz = new Array(n),
          yz = new Array(n),
          x0 = Infinity,
          y0 = Infinity,
          x1 = -Infinity,
          y1 = -Infinity;

      // Compute the points and their extent.
      for (i = 0; i < n; ++i) {
        if (isNaN(x = +this._x.call(null, d = data[i])) || isNaN(y = +this._y.call(null, d))) continue;
        xz[i] = x;
        yz[i] = y;
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }

      // If there were no (valid) points, abort.
      if (x0 > x1 || y0 > y1) return this;

      // Expand the tree to cover the new points.
      this.cover(x0, y0).cover(x1, y1);

      // Add the new points.
      for (i = 0; i < n; ++i) {
        add(this, xz[i], yz[i], data[i]);
      }

      return this;
    }

    function tree_cover(x, y) {
      if (isNaN(x = +x) || isNaN(y = +y)) return this; // ignore invalid points

      var x0 = this._x0,
          y0 = this._y0,
          x1 = this._x1,
          y1 = this._y1;

      // If the quadtree has no extent, initialize them.
      // Integer extent are necessary so that if we later double the extent,
      // the existing quadrant boundaries don’t change due to floating point error!
      if (isNaN(x0)) {
        x1 = (x0 = Math.floor(x)) + 1;
        y1 = (y0 = Math.floor(y)) + 1;
      }

      // Otherwise, double repeatedly to cover.
      else {
        var z = x1 - x0,
            node = this._root,
            parent,
            i;

        while (x0 > x || x >= x1 || y0 > y || y >= y1) {
          i = (y < y0) << 1 | (x < x0);
          parent = new Array(4), parent[i] = node, node = parent, z *= 2;
          switch (i) {
            case 0: x1 = x0 + z, y1 = y0 + z; break;
            case 1: x0 = x1 - z, y1 = y0 + z; break;
            case 2: x1 = x0 + z, y0 = y1 - z; break;
            case 3: x0 = x1 - z, y0 = y1 - z; break;
          }
        }

        if (this._root && this._root.length) this._root = node;
      }

      this._x0 = x0;
      this._y0 = y0;
      this._x1 = x1;
      this._y1 = y1;
      return this;
    }

    function tree_data() {
      var data = [];
      this.visit(function(node) {
        if (!node.length) do data.push(node.data); while (node = node.next)
      });
      return data;
    }

    function tree_extent(_) {
      return arguments.length
          ? this.cover(+_[0][0], +_[0][1]).cover(+_[1][0], +_[1][1])
          : isNaN(this._x0) ? undefined : [[this._x0, this._y0], [this._x1, this._y1]];
    }

    function Quad(node, x0, y0, x1, y1) {
      this.node = node;
      this.x0 = x0;
      this.y0 = y0;
      this.x1 = x1;
      this.y1 = y1;
    }

    function tree_find(x, y, radius) {
      var data,
          x0 = this._x0,
          y0 = this._y0,
          x1,
          y1,
          x2,
          y2,
          x3 = this._x1,
          y3 = this._y1,
          quads = [],
          node = this._root,
          q,
          i;

      if (node) quads.push(new Quad(node, x0, y0, x3, y3));
      if (radius == null) radius = Infinity;
      else {
        x0 = x - radius, y0 = y - radius;
        x3 = x + radius, y3 = y + radius;
        radius *= radius;
      }

      while (q = quads.pop()) {

        // Stop searching if this quadrant can’t contain a closer node.
        if (!(node = q.node)
            || (x1 = q.x0) > x3
            || (y1 = q.y0) > y3
            || (x2 = q.x1) < x0
            || (y2 = q.y1) < y0) continue;

        // Bisect the current quadrant.
        if (node.length) {
          var xm = (x1 + x2) / 2,
              ym = (y1 + y2) / 2;

          quads.push(
            new Quad(node[3], xm, ym, x2, y2),
            new Quad(node[2], x1, ym, xm, y2),
            new Quad(node[1], xm, y1, x2, ym),
            new Quad(node[0], x1, y1, xm, ym)
          );

          // Visit the closest quadrant first.
          if (i = (y >= ym) << 1 | (x >= xm)) {
            q = quads[quads.length - 1];
            quads[quads.length - 1] = quads[quads.length - 1 - i];
            quads[quads.length - 1 - i] = q;
          }
        }

        // Visit this point. (Visiting coincident points isn’t necessary!)
        else {
          var dx = x - +this._x.call(null, node.data),
              dy = y - +this._y.call(null, node.data),
              d2 = dx * dx + dy * dy;
          if (d2 < radius) {
            var d = Math.sqrt(radius = d2);
            x0 = x - d, y0 = y - d;
            x3 = x + d, y3 = y + d;
            data = node.data;
          }
        }
      }

      return data;
    }

    function tree_remove(d) {
      if (isNaN(x = +this._x.call(null, d)) || isNaN(y = +this._y.call(null, d))) return this; // ignore invalid points

      var parent,
          node = this._root,
          retainer,
          previous,
          next,
          x0 = this._x0,
          y0 = this._y0,
          x1 = this._x1,
          y1 = this._y1,
          x,
          y,
          xm,
          ym,
          right,
          bottom,
          i,
          j;

      // If the tree is empty, initialize the root as a leaf.
      if (!node) return this;

      // Find the leaf node for the point.
      // While descending, also retain the deepest parent with a non-removed sibling.
      if (node.length) while (true) {
        if (right = x >= (xm = (x0 + x1) / 2)) x0 = xm; else x1 = xm;
        if (bottom = y >= (ym = (y0 + y1) / 2)) y0 = ym; else y1 = ym;
        if (!(parent = node, node = node[i = bottom << 1 | right])) return this;
        if (!node.length) break;
        if (parent[(i + 1) & 3] || parent[(i + 2) & 3] || parent[(i + 3) & 3]) retainer = parent, j = i;
      }

      // Find the point to remove.
      while (node.data !== d) if (!(previous = node, node = node.next)) return this;
      if (next = node.next) delete node.next;

      // If there are multiple coincident points, remove just the point.
      if (previous) return (next ? previous.next = next : delete previous.next), this;

      // If this is the root point, remove it.
      if (!parent) return this._root = next, this;

      // Remove this leaf.
      next ? parent[i] = next : delete parent[i];

      // If the parent now contains exactly one leaf, collapse superfluous parents.
      if ((node = parent[0] || parent[1] || parent[2] || parent[3])
          && node === (parent[3] || parent[2] || parent[1] || parent[0])
          && !node.length) {
        if (retainer) retainer[j] = node;
        else this._root = node;
      }

      return this;
    }

    function removeAll(data) {
      for (var i = 0, n = data.length; i < n; ++i) this.remove(data[i]);
      return this;
    }

    function tree_root() {
      return this._root;
    }

    function tree_size() {
      var size = 0;
      this.visit(function(node) {
        if (!node.length) do ++size; while (node = node.next)
      });
      return size;
    }

    function tree_visit(callback) {
      var quads = [], q, node = this._root, child, x0, y0, x1, y1;
      if (node) quads.push(new Quad(node, this._x0, this._y0, this._x1, this._y1));
      while (q = quads.pop()) {
        if (!callback(node = q.node, x0 = q.x0, y0 = q.y0, x1 = q.x1, y1 = q.y1) && node.length) {
          var xm = (x0 + x1) / 2, ym = (y0 + y1) / 2;
          if (child = node[3]) quads.push(new Quad(child, xm, ym, x1, y1));
          if (child = node[2]) quads.push(new Quad(child, x0, ym, xm, y1));
          if (child = node[1]) quads.push(new Quad(child, xm, y0, x1, ym));
          if (child = node[0]) quads.push(new Quad(child, x0, y0, xm, ym));
        }
      }
      return this;
    }

    function tree_visitAfter(callback) {
      var quads = [], next = [], q;
      if (this._root) quads.push(new Quad(this._root, this._x0, this._y0, this._x1, this._y1));
      while (q = quads.pop()) {
        var node = q.node;
        if (node.length) {
          var child, x0 = q.x0, y0 = q.y0, x1 = q.x1, y1 = q.y1, xm = (x0 + x1) / 2, ym = (y0 + y1) / 2;
          if (child = node[0]) quads.push(new Quad(child, x0, y0, xm, ym));
          if (child = node[1]) quads.push(new Quad(child, xm, y0, x1, ym));
          if (child = node[2]) quads.push(new Quad(child, x0, ym, xm, y1));
          if (child = node[3]) quads.push(new Quad(child, xm, ym, x1, y1));
        }
        next.push(q);
      }
      while (q = next.pop()) {
        callback(q.node, q.x0, q.y0, q.x1, q.y1);
      }
      return this;
    }

    function defaultX(d) {
      return d[0];
    }

    function tree_x(_) {
      return arguments.length ? (this._x = _, this) : this._x;
    }

    function defaultY(d) {
      return d[1];
    }

    function tree_y(_) {
      return arguments.length ? (this._y = _, this) : this._y;
    }

    function quadtree(nodes, x, y) {
      var tree = new Quadtree(x == null ? defaultX : x, y == null ? defaultY : y, NaN, NaN, NaN, NaN);
      return nodes == null ? tree : tree.addAll(nodes);
    }

    function Quadtree(x, y, x0, y0, x1, y1) {
      this._x = x;
      this._y = y;
      this._x0 = x0;
      this._y0 = y0;
      this._x1 = x1;
      this._y1 = y1;
      this._root = undefined;
    }

    function leaf_copy(leaf) {
      var copy = {data: leaf.data}, next = copy;
      while (leaf = leaf.next) next = next.next = {data: leaf.data};
      return copy;
    }

    var treeProto = quadtree.prototype = Quadtree.prototype;

    treeProto.copy = function() {
      var copy = new Quadtree(this._x, this._y, this._x0, this._y0, this._x1, this._y1),
          node = this._root,
          nodes,
          child;

      if (!node) return copy;

      if (!node.length) return copy._root = leaf_copy(node), copy;

      nodes = [{source: node, target: copy._root = new Array(4)}];
      while (node = nodes.pop()) {
        for (var i = 0; i < 4; ++i) {
          if (child = node.source[i]) {
            if (child.length) nodes.push({source: child, target: node.target[i] = new Array(4)});
            else node.target[i] = leaf_copy(child);
          }
        }
      }

      return copy;
    };

    treeProto.add = tree_add;
    treeProto.addAll = addAll;
    treeProto.cover = tree_cover;
    treeProto.data = tree_data;
    treeProto.extent = tree_extent;
    treeProto.find = tree_find;
    treeProto.remove = tree_remove;
    treeProto.removeAll = removeAll;
    treeProto.root = tree_root;
    treeProto.size = tree_size;
    treeProto.visit = tree_visit;
    treeProto.visitAfter = tree_visitAfter;
    treeProto.x = tree_x;
    treeProto.y = tree_y;

    var initialAngle = Math.PI * (3 - Math.sqrt(5));

    // Computes the decimal coefficient and exponent of the specified number x with
    // significant digits p, where x is positive and p is in [1, 21] or undefined.
    // For example, formatDecimal(1.23) returns ["123", 0].
    function formatDecimal(x, p) {
      if ((i = (x = p ? x.toExponential(p - 1) : x.toExponential()).indexOf("e")) < 0) return null; // NaN, ±Infinity
      var i, coefficient = x.slice(0, i);

      // The string returned by toExponential either has the form \d\.\d+e[-+]\d+
      // (e.g., 1.2e+3) or the form \de[-+]\d+ (e.g., 1e+3).
      return [
        coefficient.length > 1 ? coefficient[0] + coefficient.slice(2) : coefficient,
        +x.slice(i + 1)
      ];
    }

    function exponent(x) {
      return x = formatDecimal(Math.abs(x)), x ? x[1] : NaN;
    }

    function formatGroup(grouping, thousands) {
      return function(value, width) {
        var i = value.length,
            t = [],
            j = 0,
            g = grouping[0],
            length = 0;

        while (i > 0 && g > 0) {
          if (length + g + 1 > width) g = Math.max(1, width - length);
          t.push(value.substring(i -= g, i + g));
          if ((length += g + 1) > width) break;
          g = grouping[j = (j + 1) % grouping.length];
        }

        return t.reverse().join(thousands);
      };
    }

    function formatNumerals(numerals) {
      return function(value) {
        return value.replace(/[0-9]/g, function(i) {
          return numerals[+i];
        });
      };
    }

    // [[fill]align][sign][symbol][0][width][,][.precision][~][type]
    var re = /^(?:(.)?([<>=^]))?([+\-( ])?([$#])?(0)?(\d+)?(,)?(\.\d+)?(~)?([a-z%])?$/i;

    function formatSpecifier(specifier) {
      return new FormatSpecifier(specifier);
    }

    formatSpecifier.prototype = FormatSpecifier.prototype; // instanceof

    function FormatSpecifier(specifier) {
      if (!(match = re.exec(specifier))) throw new Error("invalid format: " + specifier);
      var match;
      this.fill = match[1] || " ";
      this.align = match[2] || ">";
      this.sign = match[3] || "-";
      this.symbol = match[4] || "";
      this.zero = !!match[5];
      this.width = match[6] && +match[6];
      this.comma = !!match[7];
      this.precision = match[8] && +match[8].slice(1);
      this.trim = !!match[9];
      this.type = match[10] || "";
    }

    FormatSpecifier.prototype.toString = function() {
      return this.fill
          + this.align
          + this.sign
          + this.symbol
          + (this.zero ? "0" : "")
          + (this.width == null ? "" : Math.max(1, this.width | 0))
          + (this.comma ? "," : "")
          + (this.precision == null ? "" : "." + Math.max(0, this.precision | 0))
          + (this.trim ? "~" : "")
          + this.type;
    };

    // Trims insignificant zeros, e.g., replaces 1.2000k with 1.2k.
    function formatTrim(s) {
      out: for (var n = s.length, i = 1, i0 = -1, i1; i < n; ++i) {
        switch (s[i]) {
          case ".": i0 = i1 = i; break;
          case "0": if (i0 === 0) i0 = i; i1 = i; break;
          default: if (i0 > 0) { if (!+s[i]) break out; i0 = 0; } break;
        }
      }
      return i0 > 0 ? s.slice(0, i0) + s.slice(i1 + 1) : s;
    }

    var prefixExponent;

    function formatPrefixAuto(x, p) {
      var d = formatDecimal(x, p);
      if (!d) return x + "";
      var coefficient = d[0],
          exponent = d[1],
          i = exponent - (prefixExponent = Math.max(-8, Math.min(8, Math.floor(exponent / 3))) * 3) + 1,
          n = coefficient.length;
      return i === n ? coefficient
          : i > n ? coefficient + new Array(i - n + 1).join("0")
          : i > 0 ? coefficient.slice(0, i) + "." + coefficient.slice(i)
          : "0." + new Array(1 - i).join("0") + formatDecimal(x, Math.max(0, p + i - 1))[0]; // less than 1y!
    }

    function formatRounded(x, p) {
      var d = formatDecimal(x, p);
      if (!d) return x + "";
      var coefficient = d[0],
          exponent = d[1];
      return exponent < 0 ? "0." + new Array(-exponent).join("0") + coefficient
          : coefficient.length > exponent + 1 ? coefficient.slice(0, exponent + 1) + "." + coefficient.slice(exponent + 1)
          : coefficient + new Array(exponent - coefficient.length + 2).join("0");
    }

    var formatTypes = {
      "%": function(x, p) { return (x * 100).toFixed(p); },
      "b": function(x) { return Math.round(x).toString(2); },
      "c": function(x) { return x + ""; },
      "d": function(x) { return Math.round(x).toString(10); },
      "e": function(x, p) { return x.toExponential(p); },
      "f": function(x, p) { return x.toFixed(p); },
      "g": function(x, p) { return x.toPrecision(p); },
      "o": function(x) { return Math.round(x).toString(8); },
      "p": function(x, p) { return formatRounded(x * 100, p); },
      "r": formatRounded,
      "s": formatPrefixAuto,
      "X": function(x) { return Math.round(x).toString(16).toUpperCase(); },
      "x": function(x) { return Math.round(x).toString(16); }
    };

    function identity$2(x) {
      return x;
    }

    var prefixes = ["y","z","a","f","p","n","µ","m","","k","M","G","T","P","E","Z","Y"];

    function formatLocale(locale) {
      var group = locale.grouping && locale.thousands ? formatGroup(locale.grouping, locale.thousands) : identity$2,
          currency = locale.currency,
          decimal = locale.decimal,
          numerals = locale.numerals ? formatNumerals(locale.numerals) : identity$2,
          percent = locale.percent || "%";

      function newFormat(specifier) {
        specifier = formatSpecifier(specifier);

        var fill = specifier.fill,
            align = specifier.align,
            sign = specifier.sign,
            symbol = specifier.symbol,
            zero = specifier.zero,
            width = specifier.width,
            comma = specifier.comma,
            precision = specifier.precision,
            trim = specifier.trim,
            type = specifier.type;

        // The "n" type is an alias for ",g".
        if (type === "n") comma = true, type = "g";

        // The "" type, and any invalid type, is an alias for ".12~g".
        else if (!formatTypes[type]) precision == null && (precision = 12), trim = true, type = "g";

        // If zero fill is specified, padding goes after sign and before digits.
        if (zero || (fill === "0" && align === "=")) zero = true, fill = "0", align = "=";

        // Compute the prefix and suffix.
        // For SI-prefix, the suffix is lazily computed.
        var prefix = symbol === "$" ? currency[0] : symbol === "#" && /[boxX]/.test(type) ? "0" + type.toLowerCase() : "",
            suffix = symbol === "$" ? currency[1] : /[%p]/.test(type) ? percent : "";

        // What format function should we use?
        // Is this an integer type?
        // Can this type generate exponential notation?
        var formatType = formatTypes[type],
            maybeSuffix = /[defgprs%]/.test(type);

        // Set the default precision if not specified,
        // or clamp the specified precision to the supported range.
        // For significant precision, it must be in [1, 21].
        // For fixed precision, it must be in [0, 20].
        precision = precision == null ? 6
            : /[gprs]/.test(type) ? Math.max(1, Math.min(21, precision))
            : Math.max(0, Math.min(20, precision));

        function format(value) {
          var valuePrefix = prefix,
              valueSuffix = suffix,
              i, n, c;

          if (type === "c") {
            valueSuffix = formatType(value) + valueSuffix;
            value = "";
          } else {
            value = +value;

            // Perform the initial formatting.
            var valueNegative = value < 0;
            value = formatType(Math.abs(value), precision);

            // Trim insignificant zeros.
            if (trim) value = formatTrim(value);

            // If a negative value rounds to zero during formatting, treat as positive.
            if (valueNegative && +value === 0) valueNegative = false;

            // Compute the prefix and suffix.
            valuePrefix = (valueNegative ? (sign === "(" ? sign : "-") : sign === "-" || sign === "(" ? "" : sign) + valuePrefix;
            valueSuffix = (type === "s" ? prefixes[8 + prefixExponent / 3] : "") + valueSuffix + (valueNegative && sign === "(" ? ")" : "");

            // Break the formatted value into the integer “value” part that can be
            // grouped, and fractional or exponential “suffix” part that is not.
            if (maybeSuffix) {
              i = -1, n = value.length;
              while (++i < n) {
                if (c = value.charCodeAt(i), 48 > c || c > 57) {
                  valueSuffix = (c === 46 ? decimal + value.slice(i + 1) : value.slice(i)) + valueSuffix;
                  value = value.slice(0, i);
                  break;
                }
              }
            }
          }

          // If the fill character is not "0", grouping is applied before padding.
          if (comma && !zero) value = group(value, Infinity);

          // Compute the padding.
          var length = valuePrefix.length + value.length + valueSuffix.length,
              padding = length < width ? new Array(width - length + 1).join(fill) : "";

          // If the fill character is "0", grouping is applied after padding.
          if (comma && zero) value = group(padding + value, padding.length ? width - valueSuffix.length : Infinity), padding = "";

          // Reconstruct the final output based on the desired alignment.
          switch (align) {
            case "<": value = valuePrefix + value + valueSuffix + padding; break;
            case "=": value = valuePrefix + padding + value + valueSuffix; break;
            case "^": value = padding.slice(0, length = padding.length >> 1) + valuePrefix + value + valueSuffix + padding.slice(length); break;
            default: value = padding + valuePrefix + value + valueSuffix; break;
          }

          return numerals(value);
        }

        format.toString = function() {
          return specifier + "";
        };

        return format;
      }

      function formatPrefix(specifier, value) {
        var f = newFormat((specifier = formatSpecifier(specifier), specifier.type = "f", specifier)),
            e = Math.max(-8, Math.min(8, Math.floor(exponent(value) / 3))) * 3,
            k = Math.pow(10, -e),
            prefix = prefixes[8 + e / 3];
        return function(value) {
          return f(k * value) + prefix;
        };
      }

      return {
        format: newFormat,
        formatPrefix: formatPrefix
      };
    }

    var locale;
    var format;
    var formatPrefix;

    defaultLocale({
      decimal: ".",
      thousands: ",",
      grouping: [3],
      currency: ["$", ""]
    });

    function defaultLocale(definition) {
      locale = formatLocale(definition);
      format = locale.format;
      formatPrefix = locale.formatPrefix;
      return locale;
    }

    function precisionFixed(step) {
      return Math.max(0, -exponent(Math.abs(step)));
    }

    function precisionPrefix(step, value) {
      return Math.max(0, Math.max(-8, Math.min(8, Math.floor(exponent(value) / 3))) * 3 - exponent(Math.abs(step)));
    }

    function precisionRound(step, max) {
      step = Math.abs(step), max = Math.abs(max) - step;
      return Math.max(0, exponent(max) - exponent(step)) + 1;
    }

    // Adds floating point numbers with twice the normal precision.
    // Reference: J. R. Shewchuk, Adaptive Precision Floating-Point Arithmetic and
    // Fast Robust Geometric Predicates, Discrete & Computational Geometry 18(3)
    // 305–363 (1997).
    // Code adapted from GeographicLib by Charles F. F. Karney,
    // http://geographiclib.sourceforge.net/

    function adder() {
      return new Adder;
    }

    function Adder() {
      this.reset();
    }

    Adder.prototype = {
      constructor: Adder,
      reset: function() {
        this.s = // rounded value
        this.t = 0; // exact error
      },
      add: function(y) {
        add$1(temp, y, this.t);
        add$1(this, temp.s, this.s);
        if (this.s) this.t += temp.t;
        else this.s = temp.t;
      },
      valueOf: function() {
        return this.s;
      }
    };

    var temp = new Adder;

    function add$1(adder, a, b) {
      var x = adder.s = a + b,
          bv = x - a,
          av = x - bv;
      adder.t = (a - av) + (b - bv);
    }

    var pi$3 = Math.PI;

    var areaRingSum = adder();

    var areaSum = adder();

    var deltaSum = adder();

    var sum = adder();

    var lengthSum = adder();

    var areaSum$1 = adder(),
        areaRingSum$1 = adder();

    var lengthSum$1 = adder();

    function initRange(domain, range) {
      switch (arguments.length) {
        case 0: break;
        case 1: this.range(domain); break;
        default: this.range(range).domain(domain); break;
      }
      return this;
    }

    var array$1 = Array.prototype;

    var map$1 = array$1.map;
    var slice = array$1.slice;

    function constant$3(x) {
      return function() {
        return x;
      };
    }

    function number(x) {
      return +x;
    }

    var unit = [0, 1];

    function identity$3(x) {
      return x;
    }

    function normalize(a, b) {
      return (b -= (a = +a))
          ? function(x) { return (x - a) / b; }
          : constant$3(isNaN(b) ? NaN : 0.5);
    }

    function clamper(domain) {
      var a = domain[0], b = domain[domain.length - 1], t;
      if (a > b) t = a, a = b, b = t;
      return function(x) { return Math.max(a, Math.min(b, x)); };
    }

    // normalize(a, b)(x) takes a domain value x in [a,b] and returns the corresponding parameter t in [0,1].
    // interpolate(a, b)(t) takes a parameter t in [0,1] and returns the corresponding range value x in [a,b].
    function bimap(domain, range, interpolate) {
      var d0 = domain[0], d1 = domain[1], r0 = range[0], r1 = range[1];
      if (d1 < d0) d0 = normalize(d1, d0), r0 = interpolate(r1, r0);
      else d0 = normalize(d0, d1), r0 = interpolate(r0, r1);
      return function(x) { return r0(d0(x)); };
    }

    function polymap(domain, range, interpolate) {
      var j = Math.min(domain.length, range.length) - 1,
          d = new Array(j),
          r = new Array(j),
          i = -1;

      // Reverse descending domains.
      if (domain[j] < domain[0]) {
        domain = domain.slice().reverse();
        range = range.slice().reverse();
      }

      while (++i < j) {
        d[i] = normalize(domain[i], domain[i + 1]);
        r[i] = interpolate(range[i], range[i + 1]);
      }

      return function(x) {
        var i = bisectRight(domain, x, 1, j) - 1;
        return r[i](d[i](x));
      };
    }

    function copy(source, target) {
      return target
          .domain(source.domain())
          .range(source.range())
          .interpolate(source.interpolate())
          .clamp(source.clamp())
          .unknown(source.unknown());
    }

    function transformer() {
      var domain = unit,
          range = unit,
          interpolate = interpolateValue,
          transform,
          untransform,
          unknown,
          clamp = identity$3,
          piecewise,
          output,
          input;

      function rescale() {
        piecewise = Math.min(domain.length, range.length) > 2 ? polymap : bimap;
        output = input = null;
        return scale;
      }

      function scale(x) {
        return isNaN(x = +x) ? unknown : (output || (output = piecewise(domain.map(transform), range, interpolate)))(transform(clamp(x)));
      }

      scale.invert = function(y) {
        return clamp(untransform((input || (input = piecewise(range, domain.map(transform), interpolateNumber)))(y)));
      };

      scale.domain = function(_) {
        return arguments.length ? (domain = map$1.call(_, number), clamp === identity$3 || (clamp = clamper(domain)), rescale()) : domain.slice();
      };

      scale.range = function(_) {
        return arguments.length ? (range = slice.call(_), rescale()) : range.slice();
      };

      scale.rangeRound = function(_) {
        return range = slice.call(_), interpolate = interpolateRound, rescale();
      };

      scale.clamp = function(_) {
        return arguments.length ? (clamp = _ ? clamper(domain) : identity$3, scale) : clamp !== identity$3;
      };

      scale.interpolate = function(_) {
        return arguments.length ? (interpolate = _, rescale()) : interpolate;
      };

      scale.unknown = function(_) {
        return arguments.length ? (unknown = _, scale) : unknown;
      };

      return function(t, u) {
        transform = t, untransform = u;
        return rescale();
      };
    }

    function continuous(transform, untransform) {
      return transformer()(transform, untransform);
    }

    function tickFormat(start, stop, count, specifier) {
      var step = tickStep(start, stop, count),
          precision;
      specifier = formatSpecifier(specifier == null ? ",f" : specifier);
      switch (specifier.type) {
        case "s": {
          var value = Math.max(Math.abs(start), Math.abs(stop));
          if (specifier.precision == null && !isNaN(precision = precisionPrefix(step, value))) specifier.precision = precision;
          return formatPrefix(specifier, value);
        }
        case "":
        case "e":
        case "g":
        case "p":
        case "r": {
          if (specifier.precision == null && !isNaN(precision = precisionRound(step, Math.max(Math.abs(start), Math.abs(stop))))) specifier.precision = precision - (specifier.type === "e");
          break;
        }
        case "f":
        case "%": {
          if (specifier.precision == null && !isNaN(precision = precisionFixed(step))) specifier.precision = precision - (specifier.type === "%") * 2;
          break;
        }
      }
      return format(specifier);
    }

    function linearish(scale) {
      var domain = scale.domain;

      scale.ticks = function(count) {
        var d = domain();
        return ticks(d[0], d[d.length - 1], count == null ? 10 : count);
      };

      scale.tickFormat = function(count, specifier) {
        var d = domain();
        return tickFormat(d[0], d[d.length - 1], count == null ? 10 : count, specifier);
      };

      scale.nice = function(count) {
        if (count == null) count = 10;

        var d = domain(),
            i0 = 0,
            i1 = d.length - 1,
            start = d[i0],
            stop = d[i1],
            step;

        if (stop < start) {
          step = start, start = stop, stop = step;
          step = i0, i0 = i1, i1 = step;
        }

        step = tickIncrement(start, stop, count);

        if (step > 0) {
          start = Math.floor(start / step) * step;
          stop = Math.ceil(stop / step) * step;
          step = tickIncrement(start, stop, count);
        } else if (step < 0) {
          start = Math.ceil(start * step) / step;
          stop = Math.floor(stop * step) / step;
          step = tickIncrement(start, stop, count);
        }

        if (step > 0) {
          d[i0] = Math.floor(start / step) * step;
          d[i1] = Math.ceil(stop / step) * step;
          domain(d);
        } else if (step < 0) {
          d[i0] = Math.ceil(start * step) / step;
          d[i1] = Math.floor(stop * step) / step;
          domain(d);
        }

        return scale;
      };

      return scale;
    }

    function linear$1() {
      var scale = continuous(identity$3, identity$3);

      scale.copy = function() {
        return copy(scale, linear$1());
      };

      initRange.apply(scale, arguments);

      return linearish(scale);
    }

    function nice(domain, interval) {
      domain = domain.slice();

      var i0 = 0,
          i1 = domain.length - 1,
          x0 = domain[i0],
          x1 = domain[i1],
          t;

      if (x1 < x0) {
        t = i0, i0 = i1, i1 = t;
        t = x0, x0 = x1, x1 = t;
      }

      domain[i0] = interval.floor(x0);
      domain[i1] = interval.ceil(x1);
      return domain;
    }

    var t0$1 = new Date,
        t1$1 = new Date;

    function newInterval(floori, offseti, count, field) {

      function interval(date) {
        return floori(date = new Date(+date)), date;
      }

      interval.floor = interval;

      interval.ceil = function(date) {
        return floori(date = new Date(date - 1)), offseti(date, 1), floori(date), date;
      };

      interval.round = function(date) {
        var d0 = interval(date),
            d1 = interval.ceil(date);
        return date - d0 < d1 - date ? d0 : d1;
      };

      interval.offset = function(date, step) {
        return offseti(date = new Date(+date), step == null ? 1 : Math.floor(step)), date;
      };

      interval.range = function(start, stop, step) {
        var range = [], previous;
        start = interval.ceil(start);
        step = step == null ? 1 : Math.floor(step);
        if (!(start < stop) || !(step > 0)) return range; // also handles Invalid Date
        do range.push(previous = new Date(+start)), offseti(start, step), floori(start);
        while (previous < start && start < stop);
        return range;
      };

      interval.filter = function(test) {
        return newInterval(function(date) {
          if (date >= date) while (floori(date), !test(date)) date.setTime(date - 1);
        }, function(date, step) {
          if (date >= date) {
            if (step < 0) while (++step <= 0) {
              while (offseti(date, -1), !test(date)) {} // eslint-disable-line no-empty
            } else while (--step >= 0) {
              while (offseti(date, +1), !test(date)) {} // eslint-disable-line no-empty
            }
          }
        });
      };

      if (count) {
        interval.count = function(start, end) {
          t0$1.setTime(+start), t1$1.setTime(+end);
          floori(t0$1), floori(t1$1);
          return Math.floor(count(t0$1, t1$1));
        };

        interval.every = function(step) {
          step = Math.floor(step);
          return !isFinite(step) || !(step > 0) ? null
              : !(step > 1) ? interval
              : interval.filter(field
                  ? function(d) { return field(d) % step === 0; }
                  : function(d) { return interval.count(0, d) % step === 0; });
        };
      }

      return interval;
    }

    var millisecond = newInterval(function() {
      // noop
    }, function(date, step) {
      date.setTime(+date + step);
    }, function(start, end) {
      return end - start;
    });

    // An optimized implementation for this simple case.
    millisecond.every = function(k) {
      k = Math.floor(k);
      if (!isFinite(k) || !(k > 0)) return null;
      if (!(k > 1)) return millisecond;
      return newInterval(function(date) {
        date.setTime(Math.floor(date / k) * k);
      }, function(date, step) {
        date.setTime(+date + step * k);
      }, function(start, end) {
        return (end - start) / k;
      });
    };

    var durationSecond = 1e3;
    var durationMinute = 6e4;
    var durationHour = 36e5;
    var durationDay = 864e5;
    var durationWeek = 6048e5;

    var second = newInterval(function(date) {
      date.setTime(date - date.getMilliseconds());
    }, function(date, step) {
      date.setTime(+date + step * durationSecond);
    }, function(start, end) {
      return (end - start) / durationSecond;
    }, function(date) {
      return date.getUTCSeconds();
    });

    var minute = newInterval(function(date) {
      date.setTime(date - date.getMilliseconds() - date.getSeconds() * durationSecond);
    }, function(date, step) {
      date.setTime(+date + step * durationMinute);
    }, function(start, end) {
      return (end - start) / durationMinute;
    }, function(date) {
      return date.getMinutes();
    });

    var hour = newInterval(function(date) {
      date.setTime(date - date.getMilliseconds() - date.getSeconds() * durationSecond - date.getMinutes() * durationMinute);
    }, function(date, step) {
      date.setTime(+date + step * durationHour);
    }, function(start, end) {
      return (end - start) / durationHour;
    }, function(date) {
      return date.getHours();
    });

    var day = newInterval(function(date) {
      date.setHours(0, 0, 0, 0);
    }, function(date, step) {
      date.setDate(date.getDate() + step);
    }, function(start, end) {
      return (end - start - (end.getTimezoneOffset() - start.getTimezoneOffset()) * durationMinute) / durationDay;
    }, function(date) {
      return date.getDate() - 1;
    });

    function weekday(i) {
      return newInterval(function(date) {
        date.setDate(date.getDate() - (date.getDay() + 7 - i) % 7);
        date.setHours(0, 0, 0, 0);
      }, function(date, step) {
        date.setDate(date.getDate() + step * 7);
      }, function(start, end) {
        return (end - start - (end.getTimezoneOffset() - start.getTimezoneOffset()) * durationMinute) / durationWeek;
      });
    }

    var sunday = weekday(0);
    var monday = weekday(1);
    var tuesday = weekday(2);
    var wednesday = weekday(3);
    var thursday = weekday(4);
    var friday = weekday(5);
    var saturday = weekday(6);

    var month = newInterval(function(date) {
      date.setDate(1);
      date.setHours(0, 0, 0, 0);
    }, function(date, step) {
      date.setMonth(date.getMonth() + step);
    }, function(start, end) {
      return end.getMonth() - start.getMonth() + (end.getFullYear() - start.getFullYear()) * 12;
    }, function(date) {
      return date.getMonth();
    });

    var year = newInterval(function(date) {
      date.setMonth(0, 1);
      date.setHours(0, 0, 0, 0);
    }, function(date, step) {
      date.setFullYear(date.getFullYear() + step);
    }, function(start, end) {
      return end.getFullYear() - start.getFullYear();
    }, function(date) {
      return date.getFullYear();
    });

    // An optimized implementation for this simple case.
    year.every = function(k) {
      return !isFinite(k = Math.floor(k)) || !(k > 0) ? null : newInterval(function(date) {
        date.setFullYear(Math.floor(date.getFullYear() / k) * k);
        date.setMonth(0, 1);
        date.setHours(0, 0, 0, 0);
      }, function(date, step) {
        date.setFullYear(date.getFullYear() + step * k);
      });
    };

    var utcMinute = newInterval(function(date) {
      date.setUTCSeconds(0, 0);
    }, function(date, step) {
      date.setTime(+date + step * durationMinute);
    }, function(start, end) {
      return (end - start) / durationMinute;
    }, function(date) {
      return date.getUTCMinutes();
    });

    var utcHour = newInterval(function(date) {
      date.setUTCMinutes(0, 0, 0);
    }, function(date, step) {
      date.setTime(+date + step * durationHour);
    }, function(start, end) {
      return (end - start) / durationHour;
    }, function(date) {
      return date.getUTCHours();
    });

    var utcDay = newInterval(function(date) {
      date.setUTCHours(0, 0, 0, 0);
    }, function(date, step) {
      date.setUTCDate(date.getUTCDate() + step);
    }, function(start, end) {
      return (end - start) / durationDay;
    }, function(date) {
      return date.getUTCDate() - 1;
    });

    function utcWeekday(i) {
      return newInterval(function(date) {
        date.setUTCDate(date.getUTCDate() - (date.getUTCDay() + 7 - i) % 7);
        date.setUTCHours(0, 0, 0, 0);
      }, function(date, step) {
        date.setUTCDate(date.getUTCDate() + step * 7);
      }, function(start, end) {
        return (end - start) / durationWeek;
      });
    }

    var utcSunday = utcWeekday(0);
    var utcMonday = utcWeekday(1);
    var utcTuesday = utcWeekday(2);
    var utcWednesday = utcWeekday(3);
    var utcThursday = utcWeekday(4);
    var utcFriday = utcWeekday(5);
    var utcSaturday = utcWeekday(6);

    var utcMonth = newInterval(function(date) {
      date.setUTCDate(1);
      date.setUTCHours(0, 0, 0, 0);
    }, function(date, step) {
      date.setUTCMonth(date.getUTCMonth() + step);
    }, function(start, end) {
      return end.getUTCMonth() - start.getUTCMonth() + (end.getUTCFullYear() - start.getUTCFullYear()) * 12;
    }, function(date) {
      return date.getUTCMonth();
    });

    var utcYear = newInterval(function(date) {
      date.setUTCMonth(0, 1);
      date.setUTCHours(0, 0, 0, 0);
    }, function(date, step) {
      date.setUTCFullYear(date.getUTCFullYear() + step);
    }, function(start, end) {
      return end.getUTCFullYear() - start.getUTCFullYear();
    }, function(date) {
      return date.getUTCFullYear();
    });

    // An optimized implementation for this simple case.
    utcYear.every = function(k) {
      return !isFinite(k = Math.floor(k)) || !(k > 0) ? null : newInterval(function(date) {
        date.setUTCFullYear(Math.floor(date.getUTCFullYear() / k) * k);
        date.setUTCMonth(0, 1);
        date.setUTCHours(0, 0, 0, 0);
      }, function(date, step) {
        date.setUTCFullYear(date.getUTCFullYear() + step * k);
      });
    };

    function localDate(d) {
      if (0 <= d.y && d.y < 100) {
        var date = new Date(-1, d.m, d.d, d.H, d.M, d.S, d.L);
        date.setFullYear(d.y);
        return date;
      }
      return new Date(d.y, d.m, d.d, d.H, d.M, d.S, d.L);
    }

    function utcDate(d) {
      if (0 <= d.y && d.y < 100) {
        var date = new Date(Date.UTC(-1, d.m, d.d, d.H, d.M, d.S, d.L));
        date.setUTCFullYear(d.y);
        return date;
      }
      return new Date(Date.UTC(d.y, d.m, d.d, d.H, d.M, d.S, d.L));
    }

    function newYear(y) {
      return {y: y, m: 0, d: 1, H: 0, M: 0, S: 0, L: 0};
    }

    function formatLocale$1(locale) {
      var locale_dateTime = locale.dateTime,
          locale_date = locale.date,
          locale_time = locale.time,
          locale_periods = locale.periods,
          locale_weekdays = locale.days,
          locale_shortWeekdays = locale.shortDays,
          locale_months = locale.months,
          locale_shortMonths = locale.shortMonths;

      var periodRe = formatRe(locale_periods),
          periodLookup = formatLookup(locale_periods),
          weekdayRe = formatRe(locale_weekdays),
          weekdayLookup = formatLookup(locale_weekdays),
          shortWeekdayRe = formatRe(locale_shortWeekdays),
          shortWeekdayLookup = formatLookup(locale_shortWeekdays),
          monthRe = formatRe(locale_months),
          monthLookup = formatLookup(locale_months),
          shortMonthRe = formatRe(locale_shortMonths),
          shortMonthLookup = formatLookup(locale_shortMonths);

      var formats = {
        "a": formatShortWeekday,
        "A": formatWeekday,
        "b": formatShortMonth,
        "B": formatMonth,
        "c": null,
        "d": formatDayOfMonth,
        "e": formatDayOfMonth,
        "f": formatMicroseconds,
        "H": formatHour24,
        "I": formatHour12,
        "j": formatDayOfYear,
        "L": formatMilliseconds,
        "m": formatMonthNumber,
        "M": formatMinutes,
        "p": formatPeriod,
        "Q": formatUnixTimestamp,
        "s": formatUnixTimestampSeconds,
        "S": formatSeconds,
        "u": formatWeekdayNumberMonday,
        "U": formatWeekNumberSunday,
        "V": formatWeekNumberISO,
        "w": formatWeekdayNumberSunday,
        "W": formatWeekNumberMonday,
        "x": null,
        "X": null,
        "y": formatYear$1,
        "Y": formatFullYear,
        "Z": formatZone,
        "%": formatLiteralPercent
      };

      var utcFormats = {
        "a": formatUTCShortWeekday,
        "A": formatUTCWeekday,
        "b": formatUTCShortMonth,
        "B": formatUTCMonth,
        "c": null,
        "d": formatUTCDayOfMonth,
        "e": formatUTCDayOfMonth,
        "f": formatUTCMicroseconds,
        "H": formatUTCHour24,
        "I": formatUTCHour12,
        "j": formatUTCDayOfYear,
        "L": formatUTCMilliseconds,
        "m": formatUTCMonthNumber,
        "M": formatUTCMinutes,
        "p": formatUTCPeriod,
        "Q": formatUnixTimestamp,
        "s": formatUnixTimestampSeconds,
        "S": formatUTCSeconds,
        "u": formatUTCWeekdayNumberMonday,
        "U": formatUTCWeekNumberSunday,
        "V": formatUTCWeekNumberISO,
        "w": formatUTCWeekdayNumberSunday,
        "W": formatUTCWeekNumberMonday,
        "x": null,
        "X": null,
        "y": formatUTCYear,
        "Y": formatUTCFullYear,
        "Z": formatUTCZone,
        "%": formatLiteralPercent
      };

      var parses = {
        "a": parseShortWeekday,
        "A": parseWeekday,
        "b": parseShortMonth,
        "B": parseMonth,
        "c": parseLocaleDateTime,
        "d": parseDayOfMonth,
        "e": parseDayOfMonth,
        "f": parseMicroseconds,
        "H": parseHour24,
        "I": parseHour24,
        "j": parseDayOfYear,
        "L": parseMilliseconds,
        "m": parseMonthNumber,
        "M": parseMinutes,
        "p": parsePeriod,
        "Q": parseUnixTimestamp,
        "s": parseUnixTimestampSeconds,
        "S": parseSeconds,
        "u": parseWeekdayNumberMonday,
        "U": parseWeekNumberSunday,
        "V": parseWeekNumberISO,
        "w": parseWeekdayNumberSunday,
        "W": parseWeekNumberMonday,
        "x": parseLocaleDate,
        "X": parseLocaleTime,
        "y": parseYear,
        "Y": parseFullYear,
        "Z": parseZone,
        "%": parseLiteralPercent
      };

      // These recursive directive definitions must be deferred.
      formats.x = newFormat(locale_date, formats);
      formats.X = newFormat(locale_time, formats);
      formats.c = newFormat(locale_dateTime, formats);
      utcFormats.x = newFormat(locale_date, utcFormats);
      utcFormats.X = newFormat(locale_time, utcFormats);
      utcFormats.c = newFormat(locale_dateTime, utcFormats);

      function newFormat(specifier, formats) {
        return function(date) {
          var string = [],
              i = -1,
              j = 0,
              n = specifier.length,
              c,
              pad,
              format;

          if (!(date instanceof Date)) date = new Date(+date);

          while (++i < n) {
            if (specifier.charCodeAt(i) === 37) {
              string.push(specifier.slice(j, i));
              if ((pad = pads[c = specifier.charAt(++i)]) != null) c = specifier.charAt(++i);
              else pad = c === "e" ? " " : "0";
              if (format = formats[c]) c = format(date, pad);
              string.push(c);
              j = i + 1;
            }
          }

          string.push(specifier.slice(j, i));
          return string.join("");
        };
      }

      function newParse(specifier, newDate) {
        return function(string) {
          var d = newYear(1900),
              i = parseSpecifier(d, specifier, string += "", 0),
              week, day$1;
          if (i != string.length) return null;

          // If a UNIX timestamp is specified, return it.
          if ("Q" in d) return new Date(d.Q);

          // The am-pm flag is 0 for AM, and 1 for PM.
          if ("p" in d) d.H = d.H % 12 + d.p * 12;

          // Convert day-of-week and week-of-year to day-of-year.
          if ("V" in d) {
            if (d.V < 1 || d.V > 53) return null;
            if (!("w" in d)) d.w = 1;
            if ("Z" in d) {
              week = utcDate(newYear(d.y)), day$1 = week.getUTCDay();
              week = day$1 > 4 || day$1 === 0 ? utcMonday.ceil(week) : utcMonday(week);
              week = utcDay.offset(week, (d.V - 1) * 7);
              d.y = week.getUTCFullYear();
              d.m = week.getUTCMonth();
              d.d = week.getUTCDate() + (d.w + 6) % 7;
            } else {
              week = newDate(newYear(d.y)), day$1 = week.getDay();
              week = day$1 > 4 || day$1 === 0 ? monday.ceil(week) : monday(week);
              week = day.offset(week, (d.V - 1) * 7);
              d.y = week.getFullYear();
              d.m = week.getMonth();
              d.d = week.getDate() + (d.w + 6) % 7;
            }
          } else if ("W" in d || "U" in d) {
            if (!("w" in d)) d.w = "u" in d ? d.u % 7 : "W" in d ? 1 : 0;
            day$1 = "Z" in d ? utcDate(newYear(d.y)).getUTCDay() : newDate(newYear(d.y)).getDay();
            d.m = 0;
            d.d = "W" in d ? (d.w + 6) % 7 + d.W * 7 - (day$1 + 5) % 7 : d.w + d.U * 7 - (day$1 + 6) % 7;
          }

          // If a time zone is specified, all fields are interpreted as UTC and then
          // offset according to the specified time zone.
          if ("Z" in d) {
            d.H += d.Z / 100 | 0;
            d.M += d.Z % 100;
            return utcDate(d);
          }

          // Otherwise, all fields are in local time.
          return newDate(d);
        };
      }

      function parseSpecifier(d, specifier, string, j) {
        var i = 0,
            n = specifier.length,
            m = string.length,
            c,
            parse;

        while (i < n) {
          if (j >= m) return -1;
          c = specifier.charCodeAt(i++);
          if (c === 37) {
            c = specifier.charAt(i++);
            parse = parses[c in pads ? specifier.charAt(i++) : c];
            if (!parse || ((j = parse(d, string, j)) < 0)) return -1;
          } else if (c != string.charCodeAt(j++)) {
            return -1;
          }
        }

        return j;
      }

      function parsePeriod(d, string, i) {
        var n = periodRe.exec(string.slice(i));
        return n ? (d.p = periodLookup[n[0].toLowerCase()], i + n[0].length) : -1;
      }

      function parseShortWeekday(d, string, i) {
        var n = shortWeekdayRe.exec(string.slice(i));
        return n ? (d.w = shortWeekdayLookup[n[0].toLowerCase()], i + n[0].length) : -1;
      }

      function parseWeekday(d, string, i) {
        var n = weekdayRe.exec(string.slice(i));
        return n ? (d.w = weekdayLookup[n[0].toLowerCase()], i + n[0].length) : -1;
      }

      function parseShortMonth(d, string, i) {
        var n = shortMonthRe.exec(string.slice(i));
        return n ? (d.m = shortMonthLookup[n[0].toLowerCase()], i + n[0].length) : -1;
      }

      function parseMonth(d, string, i) {
        var n = monthRe.exec(string.slice(i));
        return n ? (d.m = monthLookup[n[0].toLowerCase()], i + n[0].length) : -1;
      }

      function parseLocaleDateTime(d, string, i) {
        return parseSpecifier(d, locale_dateTime, string, i);
      }

      function parseLocaleDate(d, string, i) {
        return parseSpecifier(d, locale_date, string, i);
      }

      function parseLocaleTime(d, string, i) {
        return parseSpecifier(d, locale_time, string, i);
      }

      function formatShortWeekday(d) {
        return locale_shortWeekdays[d.getDay()];
      }

      function formatWeekday(d) {
        return locale_weekdays[d.getDay()];
      }

      function formatShortMonth(d) {
        return locale_shortMonths[d.getMonth()];
      }

      function formatMonth(d) {
        return locale_months[d.getMonth()];
      }

      function formatPeriod(d) {
        return locale_periods[+(d.getHours() >= 12)];
      }

      function formatUTCShortWeekday(d) {
        return locale_shortWeekdays[d.getUTCDay()];
      }

      function formatUTCWeekday(d) {
        return locale_weekdays[d.getUTCDay()];
      }

      function formatUTCShortMonth(d) {
        return locale_shortMonths[d.getUTCMonth()];
      }

      function formatUTCMonth(d) {
        return locale_months[d.getUTCMonth()];
      }

      function formatUTCPeriod(d) {
        return locale_periods[+(d.getUTCHours() >= 12)];
      }

      return {
        format: function(specifier) {
          var f = newFormat(specifier += "", formats);
          f.toString = function() { return specifier; };
          return f;
        },
        parse: function(specifier) {
          var p = newParse(specifier += "", localDate);
          p.toString = function() { return specifier; };
          return p;
        },
        utcFormat: function(specifier) {
          var f = newFormat(specifier += "", utcFormats);
          f.toString = function() { return specifier; };
          return f;
        },
        utcParse: function(specifier) {
          var p = newParse(specifier, utcDate);
          p.toString = function() { return specifier; };
          return p;
        }
      };
    }

    var pads = {"-": "", "_": " ", "0": "0"},
        numberRe = /^\s*\d+/, // note: ignores next directive
        percentRe = /^%/,
        requoteRe = /[\\^$*+?|[\]().{}]/g;

    function pad$1(value, fill, width) {
      var sign = value < 0 ? "-" : "",
          string = (sign ? -value : value) + "",
          length = string.length;
      return sign + (length < width ? new Array(width - length + 1).join(fill) + string : string);
    }

    function requote(s) {
      return s.replace(requoteRe, "\\$&");
    }

    function formatRe(names) {
      return new RegExp("^(?:" + names.map(requote).join("|") + ")", "i");
    }

    function formatLookup(names) {
      var map = {}, i = -1, n = names.length;
      while (++i < n) map[names[i].toLowerCase()] = i;
      return map;
    }

    function parseWeekdayNumberSunday(d, string, i) {
      var n = numberRe.exec(string.slice(i, i + 1));
      return n ? (d.w = +n[0], i + n[0].length) : -1;
    }

    function parseWeekdayNumberMonday(d, string, i) {
      var n = numberRe.exec(string.slice(i, i + 1));
      return n ? (d.u = +n[0], i + n[0].length) : -1;
    }

    function parseWeekNumberSunday(d, string, i) {
      var n = numberRe.exec(string.slice(i, i + 2));
      return n ? (d.U = +n[0], i + n[0].length) : -1;
    }

    function parseWeekNumberISO(d, string, i) {
      var n = numberRe.exec(string.slice(i, i + 2));
      return n ? (d.V = +n[0], i + n[0].length) : -1;
    }

    function parseWeekNumberMonday(d, string, i) {
      var n = numberRe.exec(string.slice(i, i + 2));
      return n ? (d.W = +n[0], i + n[0].length) : -1;
    }

    function parseFullYear(d, string, i) {
      var n = numberRe.exec(string.slice(i, i + 4));
      return n ? (d.y = +n[0], i + n[0].length) : -1;
    }

    function parseYear(d, string, i) {
      var n = numberRe.exec(string.slice(i, i + 2));
      return n ? (d.y = +n[0] + (+n[0] > 68 ? 1900 : 2000), i + n[0].length) : -1;
    }

    function parseZone(d, string, i) {
      var n = /^(Z)|([+-]\d\d)(?::?(\d\d))?/.exec(string.slice(i, i + 6));
      return n ? (d.Z = n[1] ? 0 : -(n[2] + (n[3] || "00")), i + n[0].length) : -1;
    }

    function parseMonthNumber(d, string, i) {
      var n = numberRe.exec(string.slice(i, i + 2));
      return n ? (d.m = n[0] - 1, i + n[0].length) : -1;
    }

    function parseDayOfMonth(d, string, i) {
      var n = numberRe.exec(string.slice(i, i + 2));
      return n ? (d.d = +n[0], i + n[0].length) : -1;
    }

    function parseDayOfYear(d, string, i) {
      var n = numberRe.exec(string.slice(i, i + 3));
      return n ? (d.m = 0, d.d = +n[0], i + n[0].length) : -1;
    }

    function parseHour24(d, string, i) {
      var n = numberRe.exec(string.slice(i, i + 2));
      return n ? (d.H = +n[0], i + n[0].length) : -1;
    }

    function parseMinutes(d, string, i) {
      var n = numberRe.exec(string.slice(i, i + 2));
      return n ? (d.M = +n[0], i + n[0].length) : -1;
    }

    function parseSeconds(d, string, i) {
      var n = numberRe.exec(string.slice(i, i + 2));
      return n ? (d.S = +n[0], i + n[0].length) : -1;
    }

    function parseMilliseconds(d, string, i) {
      var n = numberRe.exec(string.slice(i, i + 3));
      return n ? (d.L = +n[0], i + n[0].length) : -1;
    }

    function parseMicroseconds(d, string, i) {
      var n = numberRe.exec(string.slice(i, i + 6));
      return n ? (d.L = Math.floor(n[0] / 1000), i + n[0].length) : -1;
    }

    function parseLiteralPercent(d, string, i) {
      var n = percentRe.exec(string.slice(i, i + 1));
      return n ? i + n[0].length : -1;
    }

    function parseUnixTimestamp(d, string, i) {
      var n = numberRe.exec(string.slice(i));
      return n ? (d.Q = +n[0], i + n[0].length) : -1;
    }

    function parseUnixTimestampSeconds(d, string, i) {
      var n = numberRe.exec(string.slice(i));
      return n ? (d.Q = (+n[0]) * 1000, i + n[0].length) : -1;
    }

    function formatDayOfMonth(d, p) {
      return pad$1(d.getDate(), p, 2);
    }

    function formatHour24(d, p) {
      return pad$1(d.getHours(), p, 2);
    }

    function formatHour12(d, p) {
      return pad$1(d.getHours() % 12 || 12, p, 2);
    }

    function formatDayOfYear(d, p) {
      return pad$1(1 + day.count(year(d), d), p, 3);
    }

    function formatMilliseconds(d, p) {
      return pad$1(d.getMilliseconds(), p, 3);
    }

    function formatMicroseconds(d, p) {
      return formatMilliseconds(d, p) + "000";
    }

    function formatMonthNumber(d, p) {
      return pad$1(d.getMonth() + 1, p, 2);
    }

    function formatMinutes(d, p) {
      return pad$1(d.getMinutes(), p, 2);
    }

    function formatSeconds(d, p) {
      return pad$1(d.getSeconds(), p, 2);
    }

    function formatWeekdayNumberMonday(d) {
      var day = d.getDay();
      return day === 0 ? 7 : day;
    }

    function formatWeekNumberSunday(d, p) {
      return pad$1(sunday.count(year(d), d), p, 2);
    }

    function formatWeekNumberISO(d, p) {
      var day = d.getDay();
      d = (day >= 4 || day === 0) ? thursday(d) : thursday.ceil(d);
      return pad$1(thursday.count(year(d), d) + (year(d).getDay() === 4), p, 2);
    }

    function formatWeekdayNumberSunday(d) {
      return d.getDay();
    }

    function formatWeekNumberMonday(d, p) {
      return pad$1(monday.count(year(d), d), p, 2);
    }

    function formatYear$1(d, p) {
      return pad$1(d.getFullYear() % 100, p, 2);
    }

    function formatFullYear(d, p) {
      return pad$1(d.getFullYear() % 10000, p, 4);
    }

    function formatZone(d) {
      var z = d.getTimezoneOffset();
      return (z > 0 ? "-" : (z *= -1, "+"))
          + pad$1(z / 60 | 0, "0", 2)
          + pad$1(z % 60, "0", 2);
    }

    function formatUTCDayOfMonth(d, p) {
      return pad$1(d.getUTCDate(), p, 2);
    }

    function formatUTCHour24(d, p) {
      return pad$1(d.getUTCHours(), p, 2);
    }

    function formatUTCHour12(d, p) {
      return pad$1(d.getUTCHours() % 12 || 12, p, 2);
    }

    function formatUTCDayOfYear(d, p) {
      return pad$1(1 + utcDay.count(utcYear(d), d), p, 3);
    }

    function formatUTCMilliseconds(d, p) {
      return pad$1(d.getUTCMilliseconds(), p, 3);
    }

    function formatUTCMicroseconds(d, p) {
      return formatUTCMilliseconds(d, p) + "000";
    }

    function formatUTCMonthNumber(d, p) {
      return pad$1(d.getUTCMonth() + 1, p, 2);
    }

    function formatUTCMinutes(d, p) {
      return pad$1(d.getUTCMinutes(), p, 2);
    }

    function formatUTCSeconds(d, p) {
      return pad$1(d.getUTCSeconds(), p, 2);
    }

    function formatUTCWeekdayNumberMonday(d) {
      var dow = d.getUTCDay();
      return dow === 0 ? 7 : dow;
    }

    function formatUTCWeekNumberSunday(d, p) {
      return pad$1(utcSunday.count(utcYear(d), d), p, 2);
    }

    function formatUTCWeekNumberISO(d, p) {
      var day = d.getUTCDay();
      d = (day >= 4 || day === 0) ? utcThursday(d) : utcThursday.ceil(d);
      return pad$1(utcThursday.count(utcYear(d), d) + (utcYear(d).getUTCDay() === 4), p, 2);
    }

    function formatUTCWeekdayNumberSunday(d) {
      return d.getUTCDay();
    }

    function formatUTCWeekNumberMonday(d, p) {
      return pad$1(utcMonday.count(utcYear(d), d), p, 2);
    }

    function formatUTCYear(d, p) {
      return pad$1(d.getUTCFullYear() % 100, p, 2);
    }

    function formatUTCFullYear(d, p) {
      return pad$1(d.getUTCFullYear() % 10000, p, 4);
    }

    function formatUTCZone() {
      return "+0000";
    }

    function formatLiteralPercent() {
      return "%";
    }

    function formatUnixTimestamp(d) {
      return +d;
    }

    function formatUnixTimestampSeconds(d) {
      return Math.floor(+d / 1000);
    }

    var locale$1;
    var timeFormat;
    var timeParse;
    var utcFormat;
    var utcParse;

    defaultLocale$1({
      dateTime: "%x, %X",
      date: "%-m/%-d/%Y",
      time: "%-I:%M:%S %p",
      periods: ["AM", "PM"],
      days: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
      shortDays: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
      months: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
      shortMonths: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    });

    function defaultLocale$1(definition) {
      locale$1 = formatLocale$1(definition);
      timeFormat = locale$1.format;
      timeParse = locale$1.parse;
      utcFormat = locale$1.utcFormat;
      utcParse = locale$1.utcParse;
      return locale$1;
    }

    var isoSpecifier = "%Y-%m-%dT%H:%M:%S.%LZ";

    function formatIsoNative(date) {
      return date.toISOString();
    }

    var formatIso = Date.prototype.toISOString
        ? formatIsoNative
        : utcFormat(isoSpecifier);

    function parseIsoNative(string) {
      var date = new Date(string);
      return isNaN(date) ? null : date;
    }

    var parseIso = +new Date("2000-01-01T00:00:00.000Z")
        ? parseIsoNative
        : utcParse(isoSpecifier);

    var durationSecond$1 = 1000,
        durationMinute$1 = durationSecond$1 * 60,
        durationHour$1 = durationMinute$1 * 60,
        durationDay$1 = durationHour$1 * 24,
        durationWeek$1 = durationDay$1 * 7,
        durationMonth = durationDay$1 * 30,
        durationYear = durationDay$1 * 365;

    function date$1(t) {
      return new Date(t);
    }

    function number$1(t) {
      return t instanceof Date ? +t : +new Date(+t);
    }

    function calendar(year, month, week, day, hour, minute, second, millisecond, format) {
      var scale = continuous(identity$3, identity$3),
          invert = scale.invert,
          domain = scale.domain;

      var formatMillisecond = format(".%L"),
          formatSecond = format(":%S"),
          formatMinute = format("%I:%M"),
          formatHour = format("%I %p"),
          formatDay = format("%a %d"),
          formatWeek = format("%b %d"),
          formatMonth = format("%B"),
          formatYear = format("%Y");

      var tickIntervals = [
        [second,  1,      durationSecond$1],
        [second,  5,  5 * durationSecond$1],
        [second, 15, 15 * durationSecond$1],
        [second, 30, 30 * durationSecond$1],
        [minute,  1,      durationMinute$1],
        [minute,  5,  5 * durationMinute$1],
        [minute, 15, 15 * durationMinute$1],
        [minute, 30, 30 * durationMinute$1],
        [  hour,  1,      durationHour$1  ],
        [  hour,  3,  3 * durationHour$1  ],
        [  hour,  6,  6 * durationHour$1  ],
        [  hour, 12, 12 * durationHour$1  ],
        [   day,  1,      durationDay$1   ],
        [   day,  2,  2 * durationDay$1   ],
        [  week,  1,      durationWeek$1  ],
        [ month,  1,      durationMonth ],
        [ month,  3,  3 * durationMonth ],
        [  year,  1,      durationYear  ]
      ];

      function tickFormat(date) {
        return (second(date) < date ? formatMillisecond
            : minute(date) < date ? formatSecond
            : hour(date) < date ? formatMinute
            : day(date) < date ? formatHour
            : month(date) < date ? (week(date) < date ? formatDay : formatWeek)
            : year(date) < date ? formatMonth
            : formatYear)(date);
      }

      function tickInterval(interval, start, stop, step) {
        if (interval == null) interval = 10;

        // If a desired tick count is specified, pick a reasonable tick interval
        // based on the extent of the domain and a rough estimate of tick size.
        // Otherwise, assume interval is already a time interval and use it.
        if (typeof interval === "number") {
          var target = Math.abs(stop - start) / interval,
              i = bisector(function(i) { return i[2]; }).right(tickIntervals, target);
          if (i === tickIntervals.length) {
            step = tickStep(start / durationYear, stop / durationYear, interval);
            interval = year;
          } else if (i) {
            i = tickIntervals[target / tickIntervals[i - 1][2] < tickIntervals[i][2] / target ? i - 1 : i];
            step = i[1];
            interval = i[0];
          } else {
            step = Math.max(tickStep(start, stop, interval), 1);
            interval = millisecond;
          }
        }

        return step == null ? interval : interval.every(step);
      }

      scale.invert = function(y) {
        return new Date(invert(y));
      };

      scale.domain = function(_) {
        return arguments.length ? domain(map$1.call(_, number$1)) : domain().map(date$1);
      };

      scale.ticks = function(interval, step) {
        var d = domain(),
            t0 = d[0],
            t1 = d[d.length - 1],
            r = t1 < t0,
            t;
        if (r) t = t0, t0 = t1, t1 = t;
        t = tickInterval(interval, t0, t1, step);
        t = t ? t.range(t0, t1 + 1) : []; // inclusive stop
        return r ? t.reverse() : t;
      };

      scale.tickFormat = function(count, specifier) {
        return specifier == null ? tickFormat : format(specifier);
      };

      scale.nice = function(interval, step) {
        var d = domain();
        return (interval = tickInterval(interval, d[0], d[d.length - 1], step))
            ? domain(nice(d, interval))
            : scale;
      };

      scale.copy = function() {
        return copy(scale, calendar(year, month, week, day, hour, minute, second, millisecond, format));
      };

      return scale;
    }

    function scaleTime() {
      return initRange.apply(calendar(year, month, sunday, day, hour, minute, second, millisecond, timeFormat).domain([new Date(2000, 0, 1), new Date(2000, 0, 2)]), arguments);
    }

    function colors(specifier) {
      var n = specifier.length / 6 | 0, colors = new Array(n), i = 0;
      while (i < n) colors[i] = "#" + specifier.slice(i * 6, ++i * 6);
      return colors;
    }

    colors("1f77b4ff7f0e2ca02cd627289467bd8c564be377c27f7f7fbcbd2217becf");

    colors("7fc97fbeaed4fdc086ffff99386cb0f0027fbf5b17666666");

    colors("1b9e77d95f027570b3e7298a66a61ee6ab02a6761d666666");

    colors("a6cee31f78b4b2df8a33a02cfb9a99e31a1cfdbf6fff7f00cab2d66a3d9affff99b15928");

    colors("fbb4aeb3cde3ccebc5decbe4fed9a6ffffcce5d8bdfddaecf2f2f2");

    colors("b3e2cdfdcdaccbd5e8f4cae4e6f5c9fff2aef1e2cccccccc");

    colors("e41a1c377eb84daf4a984ea3ff7f00ffff33a65628f781bf999999");

    colors("66c2a5fc8d628da0cbe78ac3a6d854ffd92fe5c494b3b3b3");

    colors("8dd3c7ffffb3bebadafb807280b1d3fdb462b3de69fccde5d9d9d9bc80bdccebc5ffed6f");

    function ramp(scheme) {
      return rgbBasis(scheme[scheme.length - 1]);
    }

    var scheme = new Array(3).concat(
      "d8b365f5f5f55ab4ac",
      "a6611adfc27d80cdc1018571",
      "a6611adfc27df5f5f580cdc1018571",
      "8c510ad8b365f6e8c3c7eae55ab4ac01665e",
      "8c510ad8b365f6e8c3f5f5f5c7eae55ab4ac01665e",
      "8c510abf812ddfc27df6e8c3c7eae580cdc135978f01665e",
      "8c510abf812ddfc27df6e8c3f5f5f5c7eae580cdc135978f01665e",
      "5430058c510abf812ddfc27df6e8c3c7eae580cdc135978f01665e003c30",
      "5430058c510abf812ddfc27df6e8c3f5f5f5c7eae580cdc135978f01665e003c30"
    ).map(colors);

    ramp(scheme);

    var scheme$1 = new Array(3).concat(
      "af8dc3f7f7f77fbf7b",
      "7b3294c2a5cfa6dba0008837",
      "7b3294c2a5cff7f7f7a6dba0008837",
      "762a83af8dc3e7d4e8d9f0d37fbf7b1b7837",
      "762a83af8dc3e7d4e8f7f7f7d9f0d37fbf7b1b7837",
      "762a839970abc2a5cfe7d4e8d9f0d3a6dba05aae611b7837",
      "762a839970abc2a5cfe7d4e8f7f7f7d9f0d3a6dba05aae611b7837",
      "40004b762a839970abc2a5cfe7d4e8d9f0d3a6dba05aae611b783700441b",
      "40004b762a839970abc2a5cfe7d4e8f7f7f7d9f0d3a6dba05aae611b783700441b"
    ).map(colors);

    ramp(scheme$1);

    var scheme$2 = new Array(3).concat(
      "e9a3c9f7f7f7a1d76a",
      "d01c8bf1b6dab8e1864dac26",
      "d01c8bf1b6daf7f7f7b8e1864dac26",
      "c51b7de9a3c9fde0efe6f5d0a1d76a4d9221",
      "c51b7de9a3c9fde0eff7f7f7e6f5d0a1d76a4d9221",
      "c51b7dde77aef1b6dafde0efe6f5d0b8e1867fbc414d9221",
      "c51b7dde77aef1b6dafde0eff7f7f7e6f5d0b8e1867fbc414d9221",
      "8e0152c51b7dde77aef1b6dafde0efe6f5d0b8e1867fbc414d9221276419",
      "8e0152c51b7dde77aef1b6dafde0eff7f7f7e6f5d0b8e1867fbc414d9221276419"
    ).map(colors);

    ramp(scheme$2);

    var scheme$3 = new Array(3).concat(
      "998ec3f7f7f7f1a340",
      "5e3c99b2abd2fdb863e66101",
      "5e3c99b2abd2f7f7f7fdb863e66101",
      "542788998ec3d8daebfee0b6f1a340b35806",
      "542788998ec3d8daebf7f7f7fee0b6f1a340b35806",
      "5427888073acb2abd2d8daebfee0b6fdb863e08214b35806",
      "5427888073acb2abd2d8daebf7f7f7fee0b6fdb863e08214b35806",
      "2d004b5427888073acb2abd2d8daebfee0b6fdb863e08214b358067f3b08",
      "2d004b5427888073acb2abd2d8daebf7f7f7fee0b6fdb863e08214b358067f3b08"
    ).map(colors);

    ramp(scheme$3);

    var scheme$4 = new Array(3).concat(
      "ef8a62f7f7f767a9cf",
      "ca0020f4a58292c5de0571b0",
      "ca0020f4a582f7f7f792c5de0571b0",
      "b2182bef8a62fddbc7d1e5f067a9cf2166ac",
      "b2182bef8a62fddbc7f7f7f7d1e5f067a9cf2166ac",
      "b2182bd6604df4a582fddbc7d1e5f092c5de4393c32166ac",
      "b2182bd6604df4a582fddbc7f7f7f7d1e5f092c5de4393c32166ac",
      "67001fb2182bd6604df4a582fddbc7d1e5f092c5de4393c32166ac053061",
      "67001fb2182bd6604df4a582fddbc7f7f7f7d1e5f092c5de4393c32166ac053061"
    ).map(colors);

    ramp(scheme$4);

    var scheme$5 = new Array(3).concat(
      "ef8a62ffffff999999",
      "ca0020f4a582bababa404040",
      "ca0020f4a582ffffffbababa404040",
      "b2182bef8a62fddbc7e0e0e09999994d4d4d",
      "b2182bef8a62fddbc7ffffffe0e0e09999994d4d4d",
      "b2182bd6604df4a582fddbc7e0e0e0bababa8787874d4d4d",
      "b2182bd6604df4a582fddbc7ffffffe0e0e0bababa8787874d4d4d",
      "67001fb2182bd6604df4a582fddbc7e0e0e0bababa8787874d4d4d1a1a1a",
      "67001fb2182bd6604df4a582fddbc7ffffffe0e0e0bababa8787874d4d4d1a1a1a"
    ).map(colors);

    ramp(scheme$5);

    var scheme$6 = new Array(3).concat(
      "fc8d59ffffbf91bfdb",
      "d7191cfdae61abd9e92c7bb6",
      "d7191cfdae61ffffbfabd9e92c7bb6",
      "d73027fc8d59fee090e0f3f891bfdb4575b4",
      "d73027fc8d59fee090ffffbfe0f3f891bfdb4575b4",
      "d73027f46d43fdae61fee090e0f3f8abd9e974add14575b4",
      "d73027f46d43fdae61fee090ffffbfe0f3f8abd9e974add14575b4",
      "a50026d73027f46d43fdae61fee090e0f3f8abd9e974add14575b4313695",
      "a50026d73027f46d43fdae61fee090ffffbfe0f3f8abd9e974add14575b4313695"
    ).map(colors);

    ramp(scheme$6);

    var scheme$7 = new Array(3).concat(
      "fc8d59ffffbf91cf60",
      "d7191cfdae61a6d96a1a9641",
      "d7191cfdae61ffffbfa6d96a1a9641",
      "d73027fc8d59fee08bd9ef8b91cf601a9850",
      "d73027fc8d59fee08bffffbfd9ef8b91cf601a9850",
      "d73027f46d43fdae61fee08bd9ef8ba6d96a66bd631a9850",
      "d73027f46d43fdae61fee08bffffbfd9ef8ba6d96a66bd631a9850",
      "a50026d73027f46d43fdae61fee08bd9ef8ba6d96a66bd631a9850006837",
      "a50026d73027f46d43fdae61fee08bffffbfd9ef8ba6d96a66bd631a9850006837"
    ).map(colors);

    ramp(scheme$7);

    var scheme$8 = new Array(3).concat(
      "fc8d59ffffbf99d594",
      "d7191cfdae61abdda42b83ba",
      "d7191cfdae61ffffbfabdda42b83ba",
      "d53e4ffc8d59fee08be6f59899d5943288bd",
      "d53e4ffc8d59fee08bffffbfe6f59899d5943288bd",
      "d53e4ff46d43fdae61fee08be6f598abdda466c2a53288bd",
      "d53e4ff46d43fdae61fee08bffffbfe6f598abdda466c2a53288bd",
      "9e0142d53e4ff46d43fdae61fee08be6f598abdda466c2a53288bd5e4fa2",
      "9e0142d53e4ff46d43fdae61fee08bffffbfe6f598abdda466c2a53288bd5e4fa2"
    ).map(colors);

    ramp(scheme$8);

    var scheme$9 = new Array(3).concat(
      "e5f5f999d8c92ca25f",
      "edf8fbb2e2e266c2a4238b45",
      "edf8fbb2e2e266c2a42ca25f006d2c",
      "edf8fbccece699d8c966c2a42ca25f006d2c",
      "edf8fbccece699d8c966c2a441ae76238b45005824",
      "f7fcfde5f5f9ccece699d8c966c2a441ae76238b45005824",
      "f7fcfde5f5f9ccece699d8c966c2a441ae76238b45006d2c00441b"
    ).map(colors);

    ramp(scheme$9);

    var scheme$a = new Array(3).concat(
      "e0ecf49ebcda8856a7",
      "edf8fbb3cde38c96c688419d",
      "edf8fbb3cde38c96c68856a7810f7c",
      "edf8fbbfd3e69ebcda8c96c68856a7810f7c",
      "edf8fbbfd3e69ebcda8c96c68c6bb188419d6e016b",
      "f7fcfde0ecf4bfd3e69ebcda8c96c68c6bb188419d6e016b",
      "f7fcfde0ecf4bfd3e69ebcda8c96c68c6bb188419d810f7c4d004b"
    ).map(colors);

    ramp(scheme$a);

    var scheme$b = new Array(3).concat(
      "e0f3dba8ddb543a2ca",
      "f0f9e8bae4bc7bccc42b8cbe",
      "f0f9e8bae4bc7bccc443a2ca0868ac",
      "f0f9e8ccebc5a8ddb57bccc443a2ca0868ac",
      "f0f9e8ccebc5a8ddb57bccc44eb3d32b8cbe08589e",
      "f7fcf0e0f3dbccebc5a8ddb57bccc44eb3d32b8cbe08589e",
      "f7fcf0e0f3dbccebc5a8ddb57bccc44eb3d32b8cbe0868ac084081"
    ).map(colors);

    ramp(scheme$b);

    var scheme$c = new Array(3).concat(
      "fee8c8fdbb84e34a33",
      "fef0d9fdcc8afc8d59d7301f",
      "fef0d9fdcc8afc8d59e34a33b30000",
      "fef0d9fdd49efdbb84fc8d59e34a33b30000",
      "fef0d9fdd49efdbb84fc8d59ef6548d7301f990000",
      "fff7ecfee8c8fdd49efdbb84fc8d59ef6548d7301f990000",
      "fff7ecfee8c8fdd49efdbb84fc8d59ef6548d7301fb300007f0000"
    ).map(colors);

    ramp(scheme$c);

    var scheme$d = new Array(3).concat(
      "ece2f0a6bddb1c9099",
      "f6eff7bdc9e167a9cf02818a",
      "f6eff7bdc9e167a9cf1c9099016c59",
      "f6eff7d0d1e6a6bddb67a9cf1c9099016c59",
      "f6eff7d0d1e6a6bddb67a9cf3690c002818a016450",
      "fff7fbece2f0d0d1e6a6bddb67a9cf3690c002818a016450",
      "fff7fbece2f0d0d1e6a6bddb67a9cf3690c002818a016c59014636"
    ).map(colors);

    ramp(scheme$d);

    var scheme$e = new Array(3).concat(
      "ece7f2a6bddb2b8cbe",
      "f1eef6bdc9e174a9cf0570b0",
      "f1eef6bdc9e174a9cf2b8cbe045a8d",
      "f1eef6d0d1e6a6bddb74a9cf2b8cbe045a8d",
      "f1eef6d0d1e6a6bddb74a9cf3690c00570b0034e7b",
      "fff7fbece7f2d0d1e6a6bddb74a9cf3690c00570b0034e7b",
      "fff7fbece7f2d0d1e6a6bddb74a9cf3690c00570b0045a8d023858"
    ).map(colors);

    ramp(scheme$e);

    var scheme$f = new Array(3).concat(
      "e7e1efc994c7dd1c77",
      "f1eef6d7b5d8df65b0ce1256",
      "f1eef6d7b5d8df65b0dd1c77980043",
      "f1eef6d4b9dac994c7df65b0dd1c77980043",
      "f1eef6d4b9dac994c7df65b0e7298ace125691003f",
      "f7f4f9e7e1efd4b9dac994c7df65b0e7298ace125691003f",
      "f7f4f9e7e1efd4b9dac994c7df65b0e7298ace125698004367001f"
    ).map(colors);

    ramp(scheme$f);

    var scheme$g = new Array(3).concat(
      "fde0ddfa9fb5c51b8a",
      "feebe2fbb4b9f768a1ae017e",
      "feebe2fbb4b9f768a1c51b8a7a0177",
      "feebe2fcc5c0fa9fb5f768a1c51b8a7a0177",
      "feebe2fcc5c0fa9fb5f768a1dd3497ae017e7a0177",
      "fff7f3fde0ddfcc5c0fa9fb5f768a1dd3497ae017e7a0177",
      "fff7f3fde0ddfcc5c0fa9fb5f768a1dd3497ae017e7a017749006a"
    ).map(colors);

    ramp(scheme$g);

    var scheme$h = new Array(3).concat(
      "edf8b17fcdbb2c7fb8",
      "ffffcca1dab441b6c4225ea8",
      "ffffcca1dab441b6c42c7fb8253494",
      "ffffccc7e9b47fcdbb41b6c42c7fb8253494",
      "ffffccc7e9b47fcdbb41b6c41d91c0225ea80c2c84",
      "ffffd9edf8b1c7e9b47fcdbb41b6c41d91c0225ea80c2c84",
      "ffffd9edf8b1c7e9b47fcdbb41b6c41d91c0225ea8253494081d58"
    ).map(colors);

    ramp(scheme$h);

    var scheme$i = new Array(3).concat(
      "f7fcb9addd8e31a354",
      "ffffccc2e69978c679238443",
      "ffffccc2e69978c67931a354006837",
      "ffffccd9f0a3addd8e78c67931a354006837",
      "ffffccd9f0a3addd8e78c67941ab5d238443005a32",
      "ffffe5f7fcb9d9f0a3addd8e78c67941ab5d238443005a32",
      "ffffe5f7fcb9d9f0a3addd8e78c67941ab5d238443006837004529"
    ).map(colors);

    ramp(scheme$i);

    var scheme$j = new Array(3).concat(
      "fff7bcfec44fd95f0e",
      "ffffd4fed98efe9929cc4c02",
      "ffffd4fed98efe9929d95f0e993404",
      "ffffd4fee391fec44ffe9929d95f0e993404",
      "ffffd4fee391fec44ffe9929ec7014cc4c028c2d04",
      "ffffe5fff7bcfee391fec44ffe9929ec7014cc4c028c2d04",
      "ffffe5fff7bcfee391fec44ffe9929ec7014cc4c02993404662506"
    ).map(colors);

    ramp(scheme$j);

    var scheme$k = new Array(3).concat(
      "ffeda0feb24cf03b20",
      "ffffb2fecc5cfd8d3ce31a1c",
      "ffffb2fecc5cfd8d3cf03b20bd0026",
      "ffffb2fed976feb24cfd8d3cf03b20bd0026",
      "ffffb2fed976feb24cfd8d3cfc4e2ae31a1cb10026",
      "ffffccffeda0fed976feb24cfd8d3cfc4e2ae31a1cb10026",
      "ffffccffeda0fed976feb24cfd8d3cfc4e2ae31a1cbd0026800026"
    ).map(colors);

    ramp(scheme$k);

    var scheme$l = new Array(3).concat(
      "deebf79ecae13182bd",
      "eff3ffbdd7e76baed62171b5",
      "eff3ffbdd7e76baed63182bd08519c",
      "eff3ffc6dbef9ecae16baed63182bd08519c",
      "eff3ffc6dbef9ecae16baed64292c62171b5084594",
      "f7fbffdeebf7c6dbef9ecae16baed64292c62171b5084594",
      "f7fbffdeebf7c6dbef9ecae16baed64292c62171b508519c08306b"
    ).map(colors);

    ramp(scheme$l);

    var scheme$m = new Array(3).concat(
      "e5f5e0a1d99b31a354",
      "edf8e9bae4b374c476238b45",
      "edf8e9bae4b374c47631a354006d2c",
      "edf8e9c7e9c0a1d99b74c47631a354006d2c",
      "edf8e9c7e9c0a1d99b74c47641ab5d238b45005a32",
      "f7fcf5e5f5e0c7e9c0a1d99b74c47641ab5d238b45005a32",
      "f7fcf5e5f5e0c7e9c0a1d99b74c47641ab5d238b45006d2c00441b"
    ).map(colors);

    ramp(scheme$m);

    var scheme$n = new Array(3).concat(
      "f0f0f0bdbdbd636363",
      "f7f7f7cccccc969696525252",
      "f7f7f7cccccc969696636363252525",
      "f7f7f7d9d9d9bdbdbd969696636363252525",
      "f7f7f7d9d9d9bdbdbd969696737373525252252525",
      "fffffff0f0f0d9d9d9bdbdbd969696737373525252252525",
      "fffffff0f0f0d9d9d9bdbdbd969696737373525252252525000000"
    ).map(colors);

    ramp(scheme$n);

    var scheme$o = new Array(3).concat(
      "efedf5bcbddc756bb1",
      "f2f0f7cbc9e29e9ac86a51a3",
      "f2f0f7cbc9e29e9ac8756bb154278f",
      "f2f0f7dadaebbcbddc9e9ac8756bb154278f",
      "f2f0f7dadaebbcbddc9e9ac8807dba6a51a34a1486",
      "fcfbfdefedf5dadaebbcbddc9e9ac8807dba6a51a34a1486",
      "fcfbfdefedf5dadaebbcbddc9e9ac8807dba6a51a354278f3f007d"
    ).map(colors);

    ramp(scheme$o);

    var scheme$p = new Array(3).concat(
      "fee0d2fc9272de2d26",
      "fee5d9fcae91fb6a4acb181d",
      "fee5d9fcae91fb6a4ade2d26a50f15",
      "fee5d9fcbba1fc9272fb6a4ade2d26a50f15",
      "fee5d9fcbba1fc9272fb6a4aef3b2ccb181d99000d",
      "fff5f0fee0d2fcbba1fc9272fb6a4aef3b2ccb181d99000d",
      "fff5f0fee0d2fcbba1fc9272fb6a4aef3b2ccb181da50f1567000d"
    ).map(colors);

    ramp(scheme$p);

    var scheme$q = new Array(3).concat(
      "fee6cefdae6be6550d",
      "feeddefdbe85fd8d3cd94701",
      "feeddefdbe85fd8d3ce6550da63603",
      "feeddefdd0a2fdae6bfd8d3ce6550da63603",
      "feeddefdd0a2fdae6bfd8d3cf16913d948018c2d04",
      "fff5ebfee6cefdd0a2fdae6bfd8d3cf16913d948018c2d04",
      "fff5ebfee6cefdd0a2fdae6bfd8d3cf16913d94801a636037f2704"
    ).map(colors);

    ramp(scheme$q);

    cubehelixLong(cubehelix(300, 0.5, 0.0), cubehelix(-240, 0.5, 1.0));

    var warm = cubehelixLong(cubehelix(-100, 0.75, 0.35), cubehelix(80, 1.50, 0.8));

    var cool = cubehelixLong(cubehelix(260, 0.75, 0.35), cubehelix(80, 1.50, 0.8));

    var c = cubehelix();

    var c$1 = rgb(),
        pi_1_3 = Math.PI / 3,
        pi_2_3 = Math.PI * 2 / 3;

    function ramp$1(range) {
      var n = range.length;
      return function(t) {
        return range[Math.max(0, Math.min(n - 1, Math.floor(t * n)))];
      };
    }

    ramp$1(colors("44015444025645045745055946075a46085c460a5d460b5e470d60470e6147106347116447136548146748166848176948186a481a6c481b6d481c6e481d6f481f70482071482173482374482475482576482677482878482979472a7a472c7a472d7b472e7c472f7d46307e46327e46337f463480453581453781453882443983443a83443b84433d84433e85423f854240864241864142874144874045884046883f47883f48893e49893e4a893e4c8a3d4d8a3d4e8a3c4f8a3c508b3b518b3b528b3a538b3a548c39558c39568c38588c38598c375a8c375b8d365c8d365d8d355e8d355f8d34608d34618d33628d33638d32648e32658e31668e31678e31688e30698e306a8e2f6b8e2f6c8e2e6d8e2e6e8e2e6f8e2d708e2d718e2c718e2c728e2c738e2b748e2b758e2a768e2a778e2a788e29798e297a8e297b8e287c8e287d8e277e8e277f8e27808e26818e26828e26828e25838e25848e25858e24868e24878e23888e23898e238a8d228b8d228c8d228d8d218e8d218f8d21908d21918c20928c20928c20938c1f948c1f958b1f968b1f978b1f988b1f998a1f9a8a1e9b8a1e9c891e9d891f9e891f9f881fa0881fa1881fa1871fa28720a38620a48621a58521a68522a78522a88423a98324aa8325ab8225ac8226ad8127ad8128ae8029af7f2ab07f2cb17e2db27d2eb37c2fb47c31b57b32b67a34b67935b77937b87838b9773aba763bbb753dbc743fbc7340bd7242be7144bf7046c06f48c16e4ac16d4cc26c4ec36b50c46a52c56954c56856c66758c7655ac8645cc8635ec96260ca6063cb5f65cb5e67cc5c69cd5b6ccd5a6ece5870cf5773d05675d05477d1537ad1517cd2507fd34e81d34d84d44b86d54989d5488bd6468ed64590d74393d74195d84098d83e9bd93c9dd93ba0da39a2da37a5db36a8db34aadc32addc30b0dd2fb2dd2db5de2bb8de29bade28bddf26c0df25c2df23c5e021c8e020cae11fcde11dd0e11cd2e21bd5e21ad8e219dae319dde318dfe318e2e418e5e419e7e419eae51aece51befe51cf1e51df4e61ef6e620f8e621fbe723fde725"));

    var magma = ramp$1(colors("00000401000501010601010802010902020b02020d03030f03031204041405041606051806051a07061c08071e0907200a08220b09240c09260d0a290e0b2b100b2d110c2f120d31130d34140e36150e38160f3b180f3d19103f1a10421c10441d11471e114920114b21114e22115024125325125527125829115a2a115c2c115f2d11612f116331116533106734106936106b38106c390f6e3b0f703d0f713f0f72400f74420f75440f764510774710784910784a10794c117a4e117b4f127b51127c52137c54137d56147d57157e59157e5a167e5c167f5d177f5f187f601880621980641a80651a80671b80681c816a1c816b1d816d1d816e1e81701f81721f817320817521817621817822817922827b23827c23827e24828025828125818326818426818627818827818928818b29818c29818e2a81902a81912b81932b80942c80962c80982d80992d809b2e7f9c2e7f9e2f7fa02f7fa1307ea3307ea5317ea6317da8327daa337dab337cad347cae347bb0357bb2357bb3367ab5367ab73779b83779ba3878bc3978bd3977bf3a77c03a76c23b75c43c75c53c74c73d73c83e73ca3e72cc3f71cd4071cf4070d0416fd2426fd3436ed5446dd6456cd8456cd9466bdb476adc4869de4968df4a68e04c67e24d66e34e65e44f64e55064e75263e85362e95462ea5661eb5760ec5860ed5a5fee5b5eef5d5ef05f5ef1605df2625df2645cf3655cf4675cf4695cf56b5cf66c5cf66e5cf7705cf7725cf8745cf8765cf9785df9795df97b5dfa7d5efa7f5efa815ffb835ffb8560fb8761fc8961fc8a62fc8c63fc8e64fc9065fd9266fd9467fd9668fd9869fd9a6afd9b6bfe9d6cfe9f6dfea16efea36ffea571fea772fea973feaa74feac76feae77feb078feb27afeb47bfeb67cfeb77efeb97ffebb81febd82febf84fec185fec287fec488fec68afec88cfeca8dfecc8ffecd90fecf92fed194fed395fed597fed799fed89afdda9cfddc9efddea0fde0a1fde2a3fde3a5fde5a7fde7a9fde9aafdebacfcecaefceeb0fcf0b2fcf2b4fcf4b6fcf6b8fcf7b9fcf9bbfcfbbdfcfdbf"));

    var inferno = ramp$1(colors("00000401000501010601010802010a02020c02020e03021004031204031405041706041907051b08051d09061f0a07220b07240c08260d08290e092b10092d110a30120a32140b34150b37160b39180c3c190c3e1b0c411c0c431e0c451f0c48210c4a230c4c240c4f260c51280b53290b552b0b572d0b592f0a5b310a5c320a5e340a5f3609613809623909633b09643d09653e0966400a67420a68440a68450a69470b6a490b6a4a0c6b4c0c6b4d0d6c4f0d6c510e6c520e6d540f6d550f6d57106e59106e5a116e5c126e5d126e5f136e61136e62146e64156e65156e67166e69166e6a176e6c186e6d186e6f196e71196e721a6e741a6e751b6e771c6d781c6d7a1d6d7c1d6d7d1e6d7f1e6c801f6c82206c84206b85216b87216b88226a8a226a8c23698d23698f24699025689225689326679526679727669827669a28659b29649d29649f2a63a02a63a22b62a32c61a52c60a62d60a82e5fa92e5eab2f5ead305dae305cb0315bb1325ab3325ab43359b63458b73557b93556ba3655bc3754bd3853bf3952c03a51c13a50c33b4fc43c4ec63d4dc73e4cc83f4bca404acb4149cc4248ce4347cf4446d04545d24644d34743d44842d54a41d74b3fd84c3ed94d3dda4e3cdb503bdd513ade5238df5337e05536e15635e25734e35933e45a31e55c30e65d2fe75e2ee8602de9612bea632aeb6429eb6628ec6726ed6925ee6a24ef6c23ef6e21f06f20f1711ff1731df2741cf3761bf37819f47918f57b17f57d15f67e14f68013f78212f78410f8850ff8870ef8890cf98b0bf98c0af98e09fa9008fa9207fa9407fb9606fb9706fb9906fb9b06fb9d07fc9f07fca108fca309fca50afca60cfca80dfcaa0ffcac11fcae12fcb014fcb216fcb418fbb61afbb81dfbba1ffbbc21fbbe23fac026fac228fac42afac62df9c72ff9c932f9cb35f8cd37f8cf3af7d13df7d340f6d543f6d746f5d949f5db4cf4dd4ff4df53f4e156f3e35af3e55df2e661f2e865f2ea69f1ec6df1ed71f1ef75f1f179f2f27df2f482f3f586f3f68af4f88ef5f992f6fa96f8fb9af9fc9dfafda1fcffa4"));

    var plasma = ramp$1(colors("0d088710078813078916078a19068c1b068d1d068e20068f2206902406912605912805922a05932c05942e05952f059631059733059735049837049938049a3a049a3c049b3e049c3f049c41049d43039e44039e46039f48039f4903a04b03a14c02a14e02a25002a25102a35302a35502a45601a45801a45901a55b01a55c01a65e01a66001a66100a76300a76400a76600a76700a86900a86a00a86c00a86e00a86f00a87100a87201a87401a87501a87701a87801a87a02a87b02a87d03a87e03a88004a88104a78305a78405a78606a68707a68808a68a09a58b0aa58d0ba58e0ca48f0da4910ea3920fa39410a29511a19613a19814a099159f9a169f9c179e9d189d9e199da01a9ca11b9ba21d9aa31e9aa51f99a62098a72197a82296aa2395ab2494ac2694ad2793ae2892b02991b12a90b22b8fb32c8eb42e8db52f8cb6308bb7318ab83289ba3388bb3488bc3587bd3786be3885bf3984c03a83c13b82c23c81c33d80c43e7fc5407ec6417dc7427cc8437bc9447aca457acb4679cc4778cc4977cd4a76ce4b75cf4c74d04d73d14e72d24f71d35171d45270d5536fd5546ed6556dd7566cd8576bd9586ada5a6ada5b69db5c68dc5d67dd5e66de5f65de6164df6263e06363e16462e26561e26660e3685fe4695ee56a5de56b5de66c5ce76e5be76f5ae87059e97158e97257ea7457eb7556eb7655ec7754ed7953ed7a52ee7b51ef7c51ef7e50f07f4ff0804ef1814df1834cf2844bf3854bf3874af48849f48948f58b47f58c46f68d45f68f44f79044f79143f79342f89441f89540f9973ff9983ef99a3efa9b3dfa9c3cfa9e3bfb9f3afba139fba238fca338fca537fca636fca835fca934fdab33fdac33fdae32fdaf31fdb130fdb22ffdb42ffdb52efeb72dfeb82cfeba2cfebb2bfebd2afebe2afec029fdc229fdc328fdc527fdc627fdc827fdca26fdcb26fccd25fcce25fcd025fcd225fbd324fbd524fbd724fad824fada24f9dc24f9dd25f8df25f8e125f7e225f7e425f6e626f6e826f5e926f5eb27f4ed27f3ee27f3f027f2f227f1f426f1f525f0f724f0f921"));

    function constant$4(x) {
      return function constant() {
        return x;
      };
    }

    var abs = Math.abs;
    var atan2 = Math.atan2;
    var cos = Math.cos;
    var max = Math.max;
    var min = Math.min;
    var sin = Math.sin;
    var sqrt = Math.sqrt;

    var epsilon$1 = 1e-12;
    var pi$4 = Math.PI;
    var halfPi = pi$4 / 2;
    var tau$2 = 2 * pi$4;

    function acos(x) {
      return x > 1 ? 0 : x < -1 ? pi$4 : Math.acos(x);
    }

    function asin(x) {
      return x >= 1 ? halfPi : x <= -1 ? -halfPi : Math.asin(x);
    }

    function arcInnerRadius(d) {
      return d.innerRadius;
    }

    function arcOuterRadius(d) {
      return d.outerRadius;
    }

    function arcStartAngle(d) {
      return d.startAngle;
    }

    function arcEndAngle(d) {
      return d.endAngle;
    }

    function arcPadAngle(d) {
      return d && d.padAngle; // Note: optional!
    }

    function intersect(x0, y0, x1, y1, x2, y2, x3, y3) {
      var x10 = x1 - x0, y10 = y1 - y0,
          x32 = x3 - x2, y32 = y3 - y2,
          t = y32 * x10 - x32 * y10;
      if (t * t < epsilon$1) return;
      t = (x32 * (y0 - y2) - y32 * (x0 - x2)) / t;
      return [x0 + t * x10, y0 + t * y10];
    }

    // Compute perpendicular offset line of length rc.
    // http://mathworld.wolfram.com/Circle-LineIntersection.html
    function cornerTangents(x0, y0, x1, y1, r1, rc, cw) {
      var x01 = x0 - x1,
          y01 = y0 - y1,
          lo = (cw ? rc : -rc) / sqrt(x01 * x01 + y01 * y01),
          ox = lo * y01,
          oy = -lo * x01,
          x11 = x0 + ox,
          y11 = y0 + oy,
          x10 = x1 + ox,
          y10 = y1 + oy,
          x00 = (x11 + x10) / 2,
          y00 = (y11 + y10) / 2,
          dx = x10 - x11,
          dy = y10 - y11,
          d2 = dx * dx + dy * dy,
          r = r1 - rc,
          D = x11 * y10 - x10 * y11,
          d = (dy < 0 ? -1 : 1) * sqrt(max(0, r * r * d2 - D * D)),
          cx0 = (D * dy - dx * d) / d2,
          cy0 = (-D * dx - dy * d) / d2,
          cx1 = (D * dy + dx * d) / d2,
          cy1 = (-D * dx + dy * d) / d2,
          dx0 = cx0 - x00,
          dy0 = cy0 - y00,
          dx1 = cx1 - x00,
          dy1 = cy1 - y00;

      // Pick the closer of the two intersection points.
      // TODO Is there a faster way to determine which intersection to use?
      if (dx0 * dx0 + dy0 * dy0 > dx1 * dx1 + dy1 * dy1) cx0 = cx1, cy0 = cy1;

      return {
        cx: cx0,
        cy: cy0,
        x01: -ox,
        y01: -oy,
        x11: cx0 * (r1 / r - 1),
        y11: cy0 * (r1 / r - 1)
      };
    }

    function d3arc() {
      var innerRadius = arcInnerRadius,
          outerRadius = arcOuterRadius,
          cornerRadius = constant$4(0),
          padRadius = null,
          startAngle = arcStartAngle,
          endAngle = arcEndAngle,
          padAngle = arcPadAngle,
          context = null;

      function arc() {
        var buffer,
            r,
            r0 = +innerRadius.apply(this, arguments),
            r1 = +outerRadius.apply(this, arguments),
            a0 = startAngle.apply(this, arguments) - halfPi,
            a1 = endAngle.apply(this, arguments) - halfPi,
            da = abs(a1 - a0),
            cw = a1 > a0;

        if (!context) context = buffer = path();

        // Ensure that the outer radius is always larger than the inner radius.
        if (r1 < r0) r = r1, r1 = r0, r0 = r;

        // Is it a point?
        if (!(r1 > epsilon$1)) context.moveTo(0, 0);

        // Or is it a circle or annulus?
        else if (da > tau$2 - epsilon$1) {
          context.moveTo(r1 * cos(a0), r1 * sin(a0));
          context.arc(0, 0, r1, a0, a1, !cw);
          if (r0 > epsilon$1) {
            context.moveTo(r0 * cos(a1), r0 * sin(a1));
            context.arc(0, 0, r0, a1, a0, cw);
          }
        }

        // Or is it a circular or annular sector?
        else {
          var a01 = a0,
              a11 = a1,
              a00 = a0,
              a10 = a1,
              da0 = da,
              da1 = da,
              ap = padAngle.apply(this, arguments) / 2,
              rp = (ap > epsilon$1) && (padRadius ? +padRadius.apply(this, arguments) : sqrt(r0 * r0 + r1 * r1)),
              rc = min(abs(r1 - r0) / 2, +cornerRadius.apply(this, arguments)),
              rc0 = rc,
              rc1 = rc,
              t0,
              t1;

          // Apply padding? Note that since r1 ≥ r0, da1 ≥ da0.
          if (rp > epsilon$1) {
            var p0 = asin(rp / r0 * sin(ap)),
                p1 = asin(rp / r1 * sin(ap));
            if ((da0 -= p0 * 2) > epsilon$1) p0 *= (cw ? 1 : -1), a00 += p0, a10 -= p0;
            else da0 = 0, a00 = a10 = (a0 + a1) / 2;
            if ((da1 -= p1 * 2) > epsilon$1) p1 *= (cw ? 1 : -1), a01 += p1, a11 -= p1;
            else da1 = 0, a01 = a11 = (a0 + a1) / 2;
          }

          var x01 = r1 * cos(a01),
              y01 = r1 * sin(a01),
              x10 = r0 * cos(a10),
              y10 = r0 * sin(a10);

          // Apply rounded corners?
          if (rc > epsilon$1) {
            var x11 = r1 * cos(a11),
                y11 = r1 * sin(a11),
                x00 = r0 * cos(a00),
                y00 = r0 * sin(a00),
                oc;

            // Restrict the corner radius according to the sector angle.
            if (da < pi$4 && (oc = intersect(x01, y01, x00, y00, x11, y11, x10, y10))) {
              var ax = x01 - oc[0],
                  ay = y01 - oc[1],
                  bx = x11 - oc[0],
                  by = y11 - oc[1],
                  kc = 1 / sin(acos((ax * bx + ay * by) / (sqrt(ax * ax + ay * ay) * sqrt(bx * bx + by * by))) / 2),
                  lc = sqrt(oc[0] * oc[0] + oc[1] * oc[1]);
              rc0 = min(rc, (r0 - lc) / (kc - 1));
              rc1 = min(rc, (r1 - lc) / (kc + 1));
            }
          }

          // Is the sector collapsed to a line?
          if (!(da1 > epsilon$1)) context.moveTo(x01, y01);

          // Does the sector’s outer ring have rounded corners?
          else if (rc1 > epsilon$1) {
            t0 = cornerTangents(x00, y00, x01, y01, r1, rc1, cw);
            t1 = cornerTangents(x11, y11, x10, y10, r1, rc1, cw);

            context.moveTo(t0.cx + t0.x01, t0.cy + t0.y01);

            // Have the corners merged?
            if (rc1 < rc) context.arc(t0.cx, t0.cy, rc1, atan2(t0.y01, t0.x01), atan2(t1.y01, t1.x01), !cw);

            // Otherwise, draw the two corners and the ring.
            else {
              context.arc(t0.cx, t0.cy, rc1, atan2(t0.y01, t0.x01), atan2(t0.y11, t0.x11), !cw);
              context.arc(0, 0, r1, atan2(t0.cy + t0.y11, t0.cx + t0.x11), atan2(t1.cy + t1.y11, t1.cx + t1.x11), !cw);
              context.arc(t1.cx, t1.cy, rc1, atan2(t1.y11, t1.x11), atan2(t1.y01, t1.x01), !cw);
            }
          }

          // Or is the outer ring just a circular arc?
          else context.moveTo(x01, y01), context.arc(0, 0, r1, a01, a11, !cw);

          // Is there no inner ring, and it’s a circular sector?
          // Or perhaps it’s an annular sector collapsed due to padding?
          if (!(r0 > epsilon$1) || !(da0 > epsilon$1)) context.lineTo(x10, y10);

          // Does the sector’s inner ring (or point) have rounded corners?
          else if (rc0 > epsilon$1) {
            t0 = cornerTangents(x10, y10, x11, y11, r0, -rc0, cw);
            t1 = cornerTangents(x01, y01, x00, y00, r0, -rc0, cw);

            context.lineTo(t0.cx + t0.x01, t0.cy + t0.y01);

            // Have the corners merged?
            if (rc0 < rc) context.arc(t0.cx, t0.cy, rc0, atan2(t0.y01, t0.x01), atan2(t1.y01, t1.x01), !cw);

            // Otherwise, draw the two corners and the ring.
            else {
              context.arc(t0.cx, t0.cy, rc0, atan2(t0.y01, t0.x01), atan2(t0.y11, t0.x11), !cw);
              context.arc(0, 0, r0, atan2(t0.cy + t0.y11, t0.cx + t0.x11), atan2(t1.cy + t1.y11, t1.cx + t1.x11), cw);
              context.arc(t1.cx, t1.cy, rc0, atan2(t1.y11, t1.x11), atan2(t1.y01, t1.x01), !cw);
            }
          }

          // Or is the inner ring just a circular arc?
          else context.arc(0, 0, r0, a10, a00, cw);
        }

        context.closePath();

        if (buffer) return context = null, buffer + "" || null;
      }

      arc.centroid = function() {
        var r = (+innerRadius.apply(this, arguments) + +outerRadius.apply(this, arguments)) / 2,
            a = (+startAngle.apply(this, arguments) + +endAngle.apply(this, arguments)) / 2 - pi$4 / 2;
        return [cos(a) * r, sin(a) * r];
      };

      arc.innerRadius = function(_) {
        return arguments.length ? (innerRadius = typeof _ === "function" ? _ : constant$4(+_), arc) : innerRadius;
      };

      arc.outerRadius = function(_) {
        return arguments.length ? (outerRadius = typeof _ === "function" ? _ : constant$4(+_), arc) : outerRadius;
      };

      arc.cornerRadius = function(_) {
        return arguments.length ? (cornerRadius = typeof _ === "function" ? _ : constant$4(+_), arc) : cornerRadius;
      };

      arc.padRadius = function(_) {
        return arguments.length ? (padRadius = _ == null ? null : typeof _ === "function" ? _ : constant$4(+_), arc) : padRadius;
      };

      arc.startAngle = function(_) {
        return arguments.length ? (startAngle = typeof _ === "function" ? _ : constant$4(+_), arc) : startAngle;
      };

      arc.endAngle = function(_) {
        return arguments.length ? (endAngle = typeof _ === "function" ? _ : constant$4(+_), arc) : endAngle;
      };

      arc.padAngle = function(_) {
        return arguments.length ? (padAngle = typeof _ === "function" ? _ : constant$4(+_), arc) : padAngle;
      };

      arc.context = function(_) {
        return arguments.length ? ((context = _ == null ? null : _), arc) : context;
      };

      return arc;
    }

    function Linear(context) {
      this._context = context;
    }

    Linear.prototype = {
      areaStart: function() {
        this._line = 0;
      },
      areaEnd: function() {
        this._line = NaN;
      },
      lineStart: function() {
        this._point = 0;
      },
      lineEnd: function() {
        if (this._line || (this._line !== 0 && this._point === 1)) this._context.closePath();
        this._line = 1 - this._line;
      },
      point: function(x, y) {
        x = +x, y = +y;
        switch (this._point) {
          case 0: this._point = 1; this._line ? this._context.lineTo(x, y) : this._context.moveTo(x, y); break;
          case 1: this._point = 2; // proceed
          default: this._context.lineTo(x, y); break;
        }
      }
    };

    function curveLinear(context) {
      return new Linear(context);
    }

    function x(p) {
      return p[0];
    }

    function y(p) {
      return p[1];
    }

    function d3line() {
      var x$1 = x,
          y$1 = y,
          defined = constant$4(true),
          context = null,
          curve = curveLinear,
          output = null;

      function line(data) {
        var i,
            n = data.length,
            d,
            defined0 = false,
            buffer;

        if (context == null) output = curve(buffer = path());

        for (i = 0; i <= n; ++i) {
          if (!(i < n && defined(d = data[i], i, data)) === defined0) {
            if (defined0 = !defined0) output.lineStart();
            else output.lineEnd();
          }
          if (defined0) output.point(+x$1(d, i, data), +y$1(d, i, data));
        }

        if (buffer) return output = null, buffer + "" || null;
      }

      line.x = function(_) {
        return arguments.length ? (x$1 = typeof _ === "function" ? _ : constant$4(+_), line) : x$1;
      };

      line.y = function(_) {
        return arguments.length ? (y$1 = typeof _ === "function" ? _ : constant$4(+_), line) : y$1;
      };

      line.defined = function(_) {
        return arguments.length ? (defined = typeof _ === "function" ? _ : constant$4(!!_), line) : defined;
      };

      line.curve = function(_) {
        return arguments.length ? (curve = _, context != null && (output = curve(context)), line) : curve;
      };

      line.context = function(_) {
        return arguments.length ? (_ == null ? context = output = null : output = curve(context = _), line) : context;
      };

      return line;
    }

    var curveRadialLinear = curveRadial(curveLinear);

    function Radial(curve) {
      this._curve = curve;
    }

    Radial.prototype = {
      areaStart: function() {
        this._curve.areaStart();
      },
      areaEnd: function() {
        this._curve.areaEnd();
      },
      lineStart: function() {
        this._curve.lineStart();
      },
      lineEnd: function() {
        this._curve.lineEnd();
      },
      point: function(a, r) {
        this._curve.point(r * Math.sin(a), r * -Math.cos(a));
      }
    };

    function curveRadial(curve) {

      function radial(context) {
        return new Radial(curve(context));
      }

      radial._curve = curve;

      return radial;
    }

    function lineRadial(l) {
      var c = l.curve;

      l.angle = l.x, delete l.x;
      l.radius = l.y, delete l.y;

      l.curve = function(_) {
        return arguments.length ? c(curveRadial(_)) : c()._curve;
      };

      return l;
    }

    function lineRadial$1() {
      return lineRadial(d3line().curve(curveRadialLinear));
    }

    function point$1(that, x, y) {
      that._context.bezierCurveTo(
        that._x1 + that._k * (that._x2 - that._x0),
        that._y1 + that._k * (that._y2 - that._y0),
        that._x2 + that._k * (that._x1 - x),
        that._y2 + that._k * (that._y1 - y),
        that._x2,
        that._y2
      );
    }

    function Cardinal(context, tension) {
      this._context = context;
      this._k = (1 - tension) / 6;
    }

    Cardinal.prototype = {
      areaStart: function() {
        this._line = 0;
      },
      areaEnd: function() {
        this._line = NaN;
      },
      lineStart: function() {
        this._x0 = this._x1 = this._x2 =
        this._y0 = this._y1 = this._y2 = NaN;
        this._point = 0;
      },
      lineEnd: function() {
        switch (this._point) {
          case 2: this._context.lineTo(this._x2, this._y2); break;
          case 3: point$1(this, this._x1, this._y1); break;
        }
        if (this._line || (this._line !== 0 && this._point === 1)) this._context.closePath();
        this._line = 1 - this._line;
      },
      point: function(x, y) {
        x = +x, y = +y;
        switch (this._point) {
          case 0: this._point = 1; this._line ? this._context.lineTo(x, y) : this._context.moveTo(x, y); break;
          case 1: this._point = 2; this._x1 = x, this._y1 = y; break;
          case 2: this._point = 3; // proceed
          default: point$1(this, x, y); break;
        }
        this._x0 = this._x1, this._x1 = this._x2, this._x2 = x;
        this._y0 = this._y1, this._y1 = this._y2, this._y2 = y;
      }
    };

    function point$2(that, x, y) {
      var x1 = that._x1,
          y1 = that._y1,
          x2 = that._x2,
          y2 = that._y2;

      if (that._l01_a > epsilon$1) {
        var a = 2 * that._l01_2a + 3 * that._l01_a * that._l12_a + that._l12_2a,
            n = 3 * that._l01_a * (that._l01_a + that._l12_a);
        x1 = (x1 * a - that._x0 * that._l12_2a + that._x2 * that._l01_2a) / n;
        y1 = (y1 * a - that._y0 * that._l12_2a + that._y2 * that._l01_2a) / n;
      }

      if (that._l23_a > epsilon$1) {
        var b = 2 * that._l23_2a + 3 * that._l23_a * that._l12_a + that._l12_2a,
            m = 3 * that._l23_a * (that._l23_a + that._l12_a);
        x2 = (x2 * b + that._x1 * that._l23_2a - x * that._l12_2a) / m;
        y2 = (y2 * b + that._y1 * that._l23_2a - y * that._l12_2a) / m;
      }

      that._context.bezierCurveTo(x1, y1, x2, y2, that._x2, that._y2);
    }

    function CatmullRom(context, alpha) {
      this._context = context;
      this._alpha = alpha;
    }

    CatmullRom.prototype = {
      areaStart: function() {
        this._line = 0;
      },
      areaEnd: function() {
        this._line = NaN;
      },
      lineStart: function() {
        this._x0 = this._x1 = this._x2 =
        this._y0 = this._y1 = this._y2 = NaN;
        this._l01_a = this._l12_a = this._l23_a =
        this._l01_2a = this._l12_2a = this._l23_2a =
        this._point = 0;
      },
      lineEnd: function() {
        switch (this._point) {
          case 2: this._context.lineTo(this._x2, this._y2); break;
          case 3: this.point(this._x2, this._y2); break;
        }
        if (this._line || (this._line !== 0 && this._point === 1)) this._context.closePath();
        this._line = 1 - this._line;
      },
      point: function(x, y) {
        x = +x, y = +y;

        if (this._point) {
          var x23 = this._x2 - x,
              y23 = this._y2 - y;
          this._l23_a = Math.sqrt(this._l23_2a = Math.pow(x23 * x23 + y23 * y23, this._alpha));
        }

        switch (this._point) {
          case 0: this._point = 1; this._line ? this._context.lineTo(x, y) : this._context.moveTo(x, y); break;
          case 1: this._point = 2; break;
          case 2: this._point = 3; // proceed
          default: point$2(this, x, y); break;
        }

        this._l01_a = this._l12_a, this._l12_a = this._l23_a;
        this._l01_2a = this._l12_2a, this._l12_2a = this._l23_2a;
        this._x0 = this._x1, this._x1 = this._x2, this._x2 = x;
        this._y0 = this._y1, this._y1 = this._y2, this._y2 = y;
      }
    };

    var curveCatmullRom = (function custom(alpha) {

      function catmullRom(context) {
        return alpha ? new CatmullRom(context, alpha) : new Cardinal(context, 0);
      }

      catmullRom.alpha = function(alpha) {
        return custom(+alpha);
      };

      return catmullRom;
    })(0.5);

    function sign(x) {
      return x < 0 ? -1 : 1;
    }

    // Calculate the slopes of the tangents (Hermite-type interpolation) based on
    // the following paper: Steffen, M. 1990. A Simple Method for Monotonic
    // Interpolation in One Dimension. Astronomy and Astrophysics, Vol. 239, NO.
    // NOV(II), P. 443, 1990.
    function slope3(that, x2, y2) {
      var h0 = that._x1 - that._x0,
          h1 = x2 - that._x1,
          s0 = (that._y1 - that._y0) / (h0 || h1 < 0 && -0),
          s1 = (y2 - that._y1) / (h1 || h0 < 0 && -0),
          p = (s0 * h1 + s1 * h0) / (h0 + h1);
      return (sign(s0) + sign(s1)) * Math.min(Math.abs(s0), Math.abs(s1), 0.5 * Math.abs(p)) || 0;
    }

    // Calculate a one-sided slope.
    function slope2(that, t) {
      var h = that._x1 - that._x0;
      return h ? (3 * (that._y1 - that._y0) / h - t) / 2 : t;
    }

    // According to https://en.wikipedia.org/wiki/Cubic_Hermite_spline#Representations
    // "you can express cubic Hermite interpolation in terms of cubic Bézier curves
    // with respect to the four values p0, p0 + m0 / 3, p1 - m1 / 3, p1".
    function point$3(that, t0, t1) {
      var x0 = that._x0,
          y0 = that._y0,
          x1 = that._x1,
          y1 = that._y1,
          dx = (x1 - x0) / 3;
      that._context.bezierCurveTo(x0 + dx, y0 + dx * t0, x1 - dx, y1 - dx * t1, x1, y1);
    }

    function MonotoneX(context) {
      this._context = context;
    }

    MonotoneX.prototype = {
      areaStart: function() {
        this._line = 0;
      },
      areaEnd: function() {
        this._line = NaN;
      },
      lineStart: function() {
        this._x0 = this._x1 =
        this._y0 = this._y1 =
        this._t0 = NaN;
        this._point = 0;
      },
      lineEnd: function() {
        switch (this._point) {
          case 2: this._context.lineTo(this._x1, this._y1); break;
          case 3: point$3(this, this._t0, slope2(this, this._t0)); break;
        }
        if (this._line || (this._line !== 0 && this._point === 1)) this._context.closePath();
        this._line = 1 - this._line;
      },
      point: function(x, y) {
        var t1 = NaN;

        x = +x, y = +y;
        if (x === this._x1 && y === this._y1) return; // Ignore coincident points.
        switch (this._point) {
          case 0: this._point = 1; this._line ? this._context.lineTo(x, y) : this._context.moveTo(x, y); break;
          case 1: this._point = 2; break;
          case 2: this._point = 3; point$3(this, slope2(this, t1 = slope3(this, x, y)), t1); break;
          default: point$3(this, this._t0, t1 = slope3(this, x, y)); break;
        }

        this._x0 = this._x1, this._x1 = x;
        this._y0 = this._y1, this._y1 = y;
        this._t0 = t1;
      }
    };

    function MonotoneY(context) {
      this._context = new ReflectContext(context);
    }

    (MonotoneY.prototype = Object.create(MonotoneX.prototype)).point = function(x, y) {
      MonotoneX.prototype.point.call(this, y, x);
    };

    function ReflectContext(context) {
      this._context = context;
    }

    ReflectContext.prototype = {
      moveTo: function(x, y) { this._context.moveTo(y, x); },
      closePath: function() { this._context.closePath(); },
      lineTo: function(x, y) { this._context.lineTo(y, x); },
      bezierCurveTo: function(x1, y1, x2, y2, x, y) { this._context.bezierCurveTo(y1, x1, y2, x2, y, x); }
    };

    function monotoneX(context) {
      return new MonotoneX(context);
    }

    /* src/RadialGraph/Coordinates.svelte generated by Svelte v3.7.0 */

    const file$1 = "src/RadialGraph/Coordinates.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = Object.create(ctx);
    	child_ctx.a = list[i];
    	child_ctx.i = i;
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = Object.create(ctx);
    	child_ctx.label = list[i].label;
    	child_ctx.radius = list[i].radius;
    	child_ctx.startAngle = list[i].startAngle;
    	child_ctx.endAngle = list[i].endAngle;
    	child_ctx.i = i;
    	return child_ctx;
    }

    // (70:2) {#if priceCoords}
    function create_if_block_2(ctx) {
    	var g, g_transform_value;

    	var each_value_1 = ctx.priceCoords;

    	var each_blocks = [];

    	for (var i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	return {
    		c: function create() {
    			g = svg_element("g");

    			for (var i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}
    			attr(g, "class", "price-coords");
    			attr(g, "transform", g_transform_value = "translate(" + ctx.width / 2 + " " + ctx.height / 2 + ")");
    			add_location(g, file$1, 70, 4, 1702);
    		},

    		m: function mount(target, anchor) {
    			insert(target, g, anchor);

    			for (var i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(g, null);
    			}
    		},

    		p: function update(changed, ctx) {
    			if (changed.priceCoords || changed.arc || changed.pi2) {
    				each_value_1 = ctx.priceCoords;

    				for (var i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(changed, child_ctx);
    					} else {
    						each_blocks[i] = create_each_block_1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(g, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}
    				each_blocks.length = each_value_1.length;
    			}

    			if ((changed.width || changed.height) && g_transform_value !== (g_transform_value = "translate(" + ctx.width / 2 + " " + ctx.height / 2 + ")")) {
    				attr(g, "transform", g_transform_value);
    			}
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(g);
    			}

    			destroy_each(each_blocks, detaching);
    		}
    	};
    }

    // (72:6) {#each priceCoords as { label, radius, startAngle, endAngle }
    function create_each_block_1(ctx) {
    	var g1, path, path_d_value, g0, text_1, t_value = ctx.label, t, g0_transform_value;

    	return {
    		c: function create() {
    			g1 = svg_element("g");
    			path = svg_element("path");
    			g0 = svg_element("g");
    			text_1 = svg_element("text");
    			t = text(t_value);
    			attr(path, "class", "price-circle svelte-1h5tbk9");
    			attr(path, "d", path_d_value = ctx.arc({radius: ctx.radius, startAngle: 0, endAngle: ctx.pi2}));
    			add_location(path, file$1, 73, 10, 1889);
    			attr(text_1, "class", "svelte-1h5tbk9");
    			add_location(text_1, file$1, 75, 12, 2058);
    			attr(g0, "class", "price-label svelte-1h5tbk9");
    			attr(g0, "transform", g0_transform_value = "translate(0 " + (- ctx.radius - 6) + ")");
    			add_location(g0, file$1, 74, 10, 1982);
    			attr(g1, "class", "price-coord svelte-1h5tbk9");
    			add_location(g1, file$1, 72, 8, 1855);
    		},

    		m: function mount(target, anchor) {
    			insert(target, g1, anchor);
    			append(g1, path);
    			append(g1, g0);
    			append(g0, text_1);
    			append(text_1, t);
    		},

    		p: function update(changed, ctx) {
    			if ((changed.priceCoords) && path_d_value !== (path_d_value = ctx.arc({radius: ctx.radius, startAngle: 0, endAngle: ctx.pi2}))) {
    				attr(path, "d", path_d_value);
    			}

    			if ((changed.priceCoords) && t_value !== (t_value = ctx.label)) {
    				set_data(t, t_value);
    			}

    			if ((changed.priceCoords) && g0_transform_value !== (g0_transform_value = "translate(0 " + (- ctx.radius - 6) + ")")) {
    				attr(g0, "transform", g0_transform_value);
    			}
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(g1);
    			}
    		}
    	};
    }

    // (84:2) {#if dayArcs}
    function create_if_block_1(ctx) {
    	var g, g_transform_value;

    	var each_value = ctx.dayArcs;

    	var each_blocks = [];

    	for (var i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	return {
    		c: function create() {
    			g = svg_element("g");

    			for (var i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}
    			attr(g, "class", "day-arcs svelte-1h5tbk9");
    			attr(g, "transform", g_transform_value = "translate(" + ctx.width / 2 + " " + ctx.height / 2 + ")");
    			add_location(g, file$1, 84, 4, 2186);
    		},

    		m: function mount(target, anchor) {
    			insert(target, g, anchor);

    			for (var i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(g, null);
    			}
    		},

    		p: function update(changed, ctx) {
    			if (changed.arcDays || changed.dayArcs) {
    				each_value = ctx.dayArcs;

    				for (var i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(changed, child_ctx);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(g, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}
    				each_blocks.length = each_value.length;
    			}

    			if ((changed.width || changed.height) && g_transform_value !== (g_transform_value = "translate(" + ctx.width / 2 + " " + ctx.height / 2 + ")")) {
    				attr(g, "transform", g_transform_value);
    			}
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(g);
    			}

    			destroy_each(each_blocks, detaching);
    		}
    	};
    }

    // (86:6) {#each dayArcs as a, i}
    function create_each_block(ctx) {
    	var path, path_d_value;

    	return {
    		c: function create() {
    			path = svg_element("path");
    			attr(path, "d", path_d_value = ctx.arcDays(ctx.a));
    			attr(path, "class", "" + (ctx.i % 2 === 0 ? 'even' : 'odd') + " svelte-1h5tbk9");
    			add_location(path, file$1, 86, 8, 2293);
    		},

    		m: function mount(target, anchor) {
    			insert(target, path, anchor);
    		},

    		p: function update(changed, ctx) {
    			if ((changed.dayArcs) && path_d_value !== (path_d_value = ctx.arcDays(ctx.a))) {
    				attr(path, "d", path_d_value);
    			}
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(path);
    			}
    		}
    	};
    }

    // (91:2) {#if priceScale}
    function create_if_block(ctx) {
    	var g, path0, path0_d_value, path1, path1_d_value, text0, textPath0, t0, t1_value = maxDays - 1, t1, t2, path2, path2_d_value, text1, textPath1, t3, g_transform_value;

    	return {
    		c: function create() {
    			g = svg_element("g");
    			path0 = svg_element("path");
    			path1 = svg_element("path");
    			text0 = svg_element("text");
    			textPath0 = svg_element("textPath");
    			t0 = text("-");
    			t1 = text(t1_value);
    			t2 = text(" days");
    			path2 = svg_element("path");
    			text1 = svg_element("text");
    			textPath1 = svg_element("textPath");
    			t3 = text("takeoff");
    			attr(path0, "class", "direction-arrow svelte-1h5tbk9");
    			attr(path0, "d", path0_d_value = ctx.arc({radius: ctx.priceScale(590), startAngle: ctx.dayToAngle(maxDays - 4.5), endAngle: ctx.dayToAngle(maxDays - 1)}).replace('Z', ''));
    			attr(path0, "marker-end", "url(#arrow)");
    			add_location(path0, file$1, 92, 6, 2496);
    			attr(path1, "id", "text-path-start");
    			attr(path1, "class", "text-path svelte-1h5tbk9");
    			attr(path1, "d", path1_d_value = ctx.arc({radius: ctx.priceScale(525), startAngle: ctx.dayToAngle(maxDays + 1.1), endAngle: ctx.dayToAngle(maxDays - 0.9)}).replace('Z', ''));
    			add_location(path1, file$1, 94, 6, 2705);
    			attr(textPath0, "href", "#text-path-start");
    			attr(textPath0, "startOffset", "27%");
    			add_location(textPath0, file$1, 96, 8, 2909);
    			attr(text0, "class", "svelte-1h5tbk9");
    			add_location(text0, file$1, 95, 6, 2894);
    			attr(path2, "id", "text-path-end");
    			attr(path2, "class", "text-path svelte-1h5tbk9");
    			attr(path2, "d", path2_d_value = ctx.arc({radius: ctx.priceScale(525), startAngle: ctx.dayToAngle(2.2), endAngle: ctx.dayToAngle(-0.4)}).replace('Z', ''));
    			add_location(path2, file$1, 98, 6, 3012);
    			attr(textPath1, "href", "#text-path-end");
    			attr(textPath1, "startOffset", "38%");
    			add_location(textPath1, file$1, 100, 8, 3195);
    			attr(text1, "class", "svelte-1h5tbk9");
    			add_location(text1, file$1, 99, 6, 3180);
    			attr(g, "class", "day-arcs-label svelte-1h5tbk9");
    			attr(g, "transform", g_transform_value = "translate(" + ctx.width / 2 + " " + ctx.height / 2 + ")");
    			add_location(g, file$1, 91, 4, 2415);
    		},

    		m: function mount(target, anchor) {
    			insert(target, g, anchor);
    			append(g, path0);
    			append(g, path1);
    			append(g, text0);
    			append(text0, textPath0);
    			append(textPath0, t0);
    			append(textPath0, t1);
    			append(textPath0, t2);
    			append(g, path2);
    			append(g, text1);
    			append(text1, textPath1);
    			append(textPath1, t3);
    		},

    		p: function update(changed, ctx) {
    			if ((changed.priceScale || changed.dayToAngle) && path0_d_value !== (path0_d_value = ctx.arc({radius: ctx.priceScale(590), startAngle: ctx.dayToAngle(maxDays - 4.5), endAngle: ctx.dayToAngle(maxDays - 1)}).replace('Z', ''))) {
    				attr(path0, "d", path0_d_value);
    			}

    			if ((changed.priceScale || changed.dayToAngle) && path1_d_value !== (path1_d_value = ctx.arc({radius: ctx.priceScale(525), startAngle: ctx.dayToAngle(maxDays + 1.1), endAngle: ctx.dayToAngle(maxDays - 0.9)}).replace('Z', ''))) {
    				attr(path1, "d", path1_d_value);
    			}

    			if ((changed.priceScale || changed.dayToAngle) && path2_d_value !== (path2_d_value = ctx.arc({radius: ctx.priceScale(525), startAngle: ctx.dayToAngle(2.2), endAngle: ctx.dayToAngle(-0.4)}).replace('Z', ''))) {
    				attr(path2, "d", path2_d_value);
    			}

    			if ((changed.width || changed.height) && g_transform_value !== (g_transform_value = "translate(" + ctx.width / 2 + " " + ctx.height / 2 + ")")) {
    				attr(g, "transform", g_transform_value);
    			}
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(g);
    			}
    		}
    	};
    }

    function create_fragment$1(ctx) {
    	var svg, defs, marker, path, if_block0_anchor, if_block1_anchor, svg_width_value, svg_height_value;

    	var if_block0 = (ctx.priceCoords) && create_if_block_2(ctx);

    	var if_block1 = (ctx.dayArcs) && create_if_block_1(ctx);

    	var if_block2 = (ctx.priceScale) && create_if_block(ctx);

    	return {
    		c: function create() {
    			svg = svg_element("svg");
    			defs = svg_element("defs");
    			marker = svg_element("marker");
    			path = svg_element("path");
    			if (if_block0) if_block0.c();
    			if_block0_anchor = empty();
    			if (if_block1) if_block1.c();
    			if_block1_anchor = empty();
    			if (if_block2) if_block2.c();
    			attr(path, "d", "M0,-5L10,0L0,5");
    			attr(path, "class", "arrow-head svelte-1h5tbk9");
    			add_location(path, file$1, 66, 6, 1602);
    			attr(marker, "id", "arrow");
    			attr(marker, "viewBox", "0 -5 10 10");
    			attr(marker, "refX", "5");
    			attr(marker, "refY", "0");
    			attr(marker, "markerWidth", "4");
    			attr(marker, "markerHeight", "4");
    			attr(marker, "orient", "auto");
    			attr(marker, "class", "svelte-1h5tbk9");
    			add_location(marker, file$1, 59, 4, 1438);
    			add_location(defs, file$1, 58, 2, 1427);
    			attr(svg, "width", svg_width_value = ctx.width || 0);
    			attr(svg, "height", svg_height_value = ctx.height || 0);
    			attr(svg, "class", "svelte-1h5tbk9");
    			add_location(svg, file$1, 57, 0, 1379);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, svg, anchor);
    			append(svg, defs);
    			append(defs, marker);
    			append(marker, path);
    			if (if_block0) if_block0.m(svg, null);
    			append(svg, if_block0_anchor);
    			if (if_block1) if_block1.m(svg, null);
    			append(svg, if_block1_anchor);
    			if (if_block2) if_block2.m(svg, null);
    		},

    		p: function update(changed, ctx) {
    			if (ctx.priceCoords) {
    				if (if_block0) {
    					if_block0.p(changed, ctx);
    				} else {
    					if_block0 = create_if_block_2(ctx);
    					if_block0.c();
    					if_block0.m(svg, if_block0_anchor);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (ctx.dayArcs) {
    				if (if_block1) {
    					if_block1.p(changed, ctx);
    				} else {
    					if_block1 = create_if_block_1(ctx);
    					if_block1.c();
    					if_block1.m(svg, if_block1_anchor);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}

    			if (ctx.priceScale) {
    				if (if_block2) {
    					if_block2.p(changed, ctx);
    				} else {
    					if_block2 = create_if_block(ctx);
    					if_block2.c();
    					if_block2.m(svg, null);
    				}
    			} else if (if_block2) {
    				if_block2.d(1);
    				if_block2 = null;
    			}

    			if ((changed.width) && svg_width_value !== (svg_width_value = ctx.width || 0)) {
    				attr(svg, "width", svg_width_value);
    			}

    			if ((changed.height) && svg_height_value !== (svg_height_value = ctx.height || 0)) {
    				attr(svg, "height", svg_height_value);
    			}
    		},

    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(svg);
    			}

    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    			if (if_block2) if_block2.d();
    		}
    	};
    }

    const maxDays = 31;

    function addNumberCommas(x) {
      return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { priceScale, dayToAngle, priceLabels = [100, 300, 500], width = 0, height = 0, colors } = $$props;

      const pi2 = Math.PI * 2;
      const arc = d3arc()
        .innerRadius(d => d.radius)
        .outerRadius(d => d.radius)
        .startAngle(d => d.startAngle)
        .endAngle(d => d.endAngle);
      const arcDays = d3arc()
        .innerRadius(d => d.innerRadius)
        .outerRadius(d => d.outerRadius)
        .startAngle(d => d.startAngle)
        .endAngle(d => d.endAngle)
        .cornerRadius(3);

      let priceCoords, dayArcs, dayArcsLabel;

    	const writable_props = ['priceScale', 'dayToAngle', 'priceLabels', 'width', 'height', 'colors'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<Coordinates> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ('priceScale' in $$props) $$invalidate('priceScale', priceScale = $$props.priceScale);
    		if ('dayToAngle' in $$props) $$invalidate('dayToAngle', dayToAngle = $$props.dayToAngle);
    		if ('priceLabels' in $$props) $$invalidate('priceLabels', priceLabels = $$props.priceLabels);
    		if ('width' in $$props) $$invalidate('width', width = $$props.width);
    		if ('height' in $$props) $$invalidate('height', height = $$props.height);
    		if ('colors' in $$props) $$invalidate('colors', colors = $$props.colors);
    	};

    	$$self.$$.update = ($$dirty = { priceScale: 1, priceLabels: 1, dayToAngle: 1 }) => {
    		if ($$dirty.priceScale || $$dirty.priceLabels || $$dirty.dayToAngle) { if (priceScale) {
            $$invalidate('priceCoords', priceCoords = priceLabels.map(price => ({
              label: `${addNumberCommas(price)} €`,
              radius: priceScale(price)
            })));
        
            $$invalidate('dayArcs', dayArcs = d3range(1, maxDays - 1, 1).map(day => {
              return {
                innerRadius: priceScale(525),
                outerRadius: priceScale(550),
                startAngle: dayToAngle(day),
                endAngle: dayToAngle(day + 1)
              };
            }));
        
            dayArcsLabel = {
              innerRadius: priceScale(570),
              outerRadius: priceScale(575),
              startAngle: dayToAngle(maxDays - 1),
              endAngle: dayToAngle(maxDays - 4.5)
            };
          } }
    	};

    	return {
    		priceScale,
    		dayToAngle,
    		priceLabels,
    		width,
    		height,
    		colors,
    		pi2,
    		arc,
    		arcDays,
    		priceCoords,
    		dayArcs
    	};
    }

    class Coordinates extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, ["priceScale", "dayToAngle", "priceLabels", "width", "height", "colors"]);

    		const { ctx } = this.$$;
    		const props = options.props || {};
    		if (ctx.priceScale === undefined && !('priceScale' in props)) {
    			console.warn("<Coordinates> was created without expected prop 'priceScale'");
    		}
    		if (ctx.dayToAngle === undefined && !('dayToAngle' in props)) {
    			console.warn("<Coordinates> was created without expected prop 'dayToAngle'");
    		}
    		if (ctx.colors === undefined && !('colors' in props)) {
    			console.warn("<Coordinates> was created without expected prop 'colors'");
    		}
    	}

    	get priceScale() {
    		throw new Error("<Coordinates>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set priceScale(value) {
    		throw new Error("<Coordinates>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get dayToAngle() {
    		throw new Error("<Coordinates>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set dayToAngle(value) {
    		throw new Error("<Coordinates>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get priceLabels() {
    		throw new Error("<Coordinates>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set priceLabels(value) {
    		throw new Error("<Coordinates>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get width() {
    		throw new Error("<Coordinates>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set width(value) {
    		throw new Error("<Coordinates>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get height() {
    		throw new Error("<Coordinates>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set height(value) {
    		throw new Error("<Coordinates>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get colors() {
    		throw new Error("<Coordinates>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set colors(value) {
    		throw new Error("<Coordinates>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    function fade(node, { delay = 0, duration = 400 }) {
        const o = +getComputedStyle(node).opacity;
        return {
            delay,
            duration,
            css: t => `opacity: ${t * o}`
        };
    }

    /* src/RadialGraph/RadialCanvas.svelte generated by Svelte v3.7.0 */

    const file$2 = "src/RadialGraph/RadialCanvas.svelte";

    // (201:4) {#if tooltip}
    function create_if_block$1(ctx) {
    	var g, rect, rect_width_value, rect_height_value, text0, t0_value = ctx.tooltip.textPrice, t0, text0_transform_value, text1, t1_value = ctx.tooltip.textDays, t1, text1_transform_value, g_transform_value, g_transition, current;

    	return {
    		c: function create() {
    			g = svg_element("g");
    			rect = svg_element("rect");
    			text0 = svg_element("text");
    			t0 = text(t0_value);
    			text1 = svg_element("text");
    			t1 = text(t1_value);
    			attr(rect, "x", "0");
    			attr(rect, "y", "0");
    			attr(rect, "width", rect_width_value = ctx.tooltip.width);
    			attr(rect, "height", rect_height_value = ctx.tooltip.height);
    			attr(rect, "rx", "6");
    			attr(rect, "ry", "6");
    			attr(rect, "class", "svelte-1loplal");
    			add_location(rect, file$2, 202, 8, 6159);
    			attr(text0, "class", "price svelte-1loplal");
    			attr(text0, "transform", text0_transform_value = "translate(" + ctx.tooltip.width / 2 + " " + ctx.tooltip.height * 0.4 + ")");
    			add_location(text0, file$2, 203, 8, 6253);
    			attr(text1, "class", "days svelte-1loplal");
    			attr(text1, "transform", text1_transform_value = "translate(" + ctx.tooltip.width / 2 + " " + ctx.tooltip.height * 0.75 + ")");
    			add_location(text1, file$2, 204, 8, 6374);
    			attr(g, "class", "tooltip svelte-1loplal");
    			attr(g, "transform", g_transform_value = "translate(" + ctx.tooltip.x + " " + ctx.tooltip.y + ")");
    			add_location(g, file$2, 201, 6, 6068);
    		},

    		m: function mount(target, anchor) {
    			insert(target, g, anchor);
    			append(g, rect);
    			append(g, text0);
    			append(text0, t0);
    			append(g, text1);
    			append(text1, t1);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			if ((!current || changed.tooltip) && rect_width_value !== (rect_width_value = ctx.tooltip.width)) {
    				attr(rect, "width", rect_width_value);
    			}

    			if ((!current || changed.tooltip) && rect_height_value !== (rect_height_value = ctx.tooltip.height)) {
    				attr(rect, "height", rect_height_value);
    			}

    			if ((!current || changed.tooltip) && t0_value !== (t0_value = ctx.tooltip.textPrice)) {
    				set_data(t0, t0_value);
    			}

    			if ((!current || changed.tooltip) && text0_transform_value !== (text0_transform_value = "translate(" + ctx.tooltip.width / 2 + " " + ctx.tooltip.height * 0.4 + ")")) {
    				attr(text0, "transform", text0_transform_value);
    			}

    			if ((!current || changed.tooltip) && t1_value !== (t1_value = ctx.tooltip.textDays)) {
    				set_data(t1, t1_value);
    			}

    			if ((!current || changed.tooltip) && text1_transform_value !== (text1_transform_value = "translate(" + ctx.tooltip.width / 2 + " " + ctx.tooltip.height * 0.75 + ")")) {
    				attr(text1, "transform", text1_transform_value);
    			}

    			if ((!current || changed.tooltip) && g_transform_value !== (g_transform_value = "translate(" + ctx.tooltip.x + " " + ctx.tooltip.y + ")")) {
    				attr(g, "transform", g_transform_value);
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			add_render_callback(() => {
    				if (!g_transition) g_transition = create_bidirectional_transition(g, fade, {}, true);
    				g_transition.run(1);
    			});

    			current = true;
    		},

    		o: function outro(local) {
    			if (!g_transition) g_transition = create_bidirectional_transition(g, fade, {}, false);
    			g_transition.run(0);

    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(g);
    				if (g_transition) g_transition.end();
    			}
    		}
    	};
    }

    function create_fragment$2(ctx) {
    	var svg, g1, g0, g1_transform_value, t0, canvas0, t1, canvas1, current, dispose;

    	var if_block = (ctx.tooltip) && create_if_block$1(ctx);

    	return {
    		c: function create() {
    			svg = svg_element("svg");
    			g1 = svg_element("g");
    			g0 = svg_element("g");
    			if (if_block) if_block.c();
    			t0 = space();
    			canvas0 = element("canvas");
    			t1 = space();
    			canvas1 = element("canvas");
    			add_location(g0, file$2, 199, 4, 6018);
    			attr(g1, "class", "circle-origin");
    			attr(g1, "transform", g1_transform_value = "translate(" + ctx.width / 2 + " " + ctx.height / 2 + ")");
    			add_location(g1, file$2, 198, 2, 5940);
    			attr(svg, "width", ctx.width);
    			attr(svg, "height", ctx.height);
    			attr(svg, "class", "svelte-1loplal");
    			add_location(svg, file$2, 197, 0, 5853);
    			attr(canvas0, "class", "visible svelte-1loplal");
    			add_location(canvas0, file$2, 209, 0, 6521);
    			attr(canvas1, "class", "hidden svelte-1loplal");
    			add_location(canvas1, file$2, 210, 0, 6581);

    			dispose = [
    				listen(window, "click", ctx.click_handler),
    				listen(svg, "click", stop_propagation(ctx.click_handler_1))
    			];
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, svg, anchor);
    			append(svg, g1);
    			append(g1, g0);
    			ctx.g0_binding(g0);
    			if (if_block) if_block.m(g1, null);
    			insert(target, t0, anchor);
    			insert(target, canvas0, anchor);
    			ctx.canvas0_binding(canvas0);
    			insert(target, t1, anchor);
    			insert(target, canvas1, anchor);
    			ctx.canvas1_binding(canvas1);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			if (ctx.tooltip) {
    				if (if_block) {
    					if_block.p(changed, ctx);
    					transition_in(if_block, 1);
    				} else {
    					if_block = create_if_block$1(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(g1, null);
    				}
    			} else if (if_block) {
    				group_outros();
    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});
    				check_outros();
    			}

    			if ((!current || changed.width || changed.height) && g1_transform_value !== (g1_transform_value = "translate(" + ctx.width / 2 + " " + ctx.height / 2 + ")")) {
    				attr(g1, "transform", g1_transform_value);
    			}

    			if (!current || changed.width) {
    				attr(svg, "width", ctx.width);
    			}

    			if (!current || changed.height) {
    				attr(svg, "height", ctx.height);
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(svg);
    			}

    			ctx.g0_binding(null);
    			if (if_block) if_block.d();

    			if (detaching) {
    				detach(t0);
    				detach(canvas0);
    			}

    			ctx.canvas0_binding(null);

    			if (detaching) {
    				detach(t1);
    				detach(canvas1);
    			}

    			ctx.canvas1_binding(null);
    			run_all(dispose);
    		}
    	};
    }

    const sf = 2;

    const globalAlpha = 1.0;

    function instance$2($$self, $$props, $$invalidate) {
    	

      let { data, width, height, colors } = $$props;

      const dispatch = createEventDispatcher();
      const dashSwitch = [[], [1, 7]];

      let canvasElement, hiddenCanvasElement, canvas, ctx, hiddenCanvas, hiddenCtx;
      let canvasData;
      let lineWidth = 2;

      let dotsG;

      let highlightId = null;
      let highlightedPoints = 60;

      let tooltip;

      function setupCanvas() {
        lineWidth = 2.7 * Math.min(width, height) / 450;

        function init(canvas, ctx) {
          canvas
            .attr('width', sf * width)
            .attr('height', sf * height)
            .style('width', `${width}px`)
            .style('height', `${height}px`);
          ctx.scale(sf, sf);
          ctx.translate(width / 2, height / 2);
          ctx.lineWidth = ctx.canvas.classList[0] === 'hidden' ? 2 * lineWidth : lineWidth;
          return [canvas, ctx];
        }

        [canvas, ctx] = init(canvas, ctx);    [hiddenCanvas, hiddenCtx] = init(hiddenCanvas, hiddenCtx);  }

      function renderColorGradients() {
        return data.map(d => {
          let color = ctx.createRadialGradient(0, 0, d.minRadius, 0, 0, d.maxRadius);
          
          color.addColorStop(0, (d.middleStop < 0.01) ? colors.endPrice : colors.lowPrice);
          color.addColorStop(d.middleStop, colors.endPrice);
          color.addColorStop(1, (d.middleStop > 0.99) ? colors.endPrice : colors.highPrice);

          return {
            ...d,
            color
          };
        });
      }

      function drawCanvas(mode, highlightId = null) {
        const context = (mode === 'hidden') ? hiddenCtx : ctx;

        context.clearRect(- width / 2, - height / 2, width, height);

        canvasData.forEach(({ id, path, color, colorId }) => {
          context.globalAlpha = (!highlightId) ? globalAlpha : ((highlightId === id) ? 1.0 : 0.1);
          context.lineCap = 'round';
          context.setLineDash(dashSwitch[0]);
          context.strokeStyle = mode === 'hidden' ? colorId : color;
          context.beginPath();
          path.forEach((point, i , arr) => {
            if (arr[i - 1] && point.gap !== arr[i - 1].gap) {
              context.setLineDash(dashSwitch[Number(arr[i - 1].gap)]);
              context.stroke();
              context.beginPath();
              context.moveTo(...arr[i - 1].d.slice(-2));
            }

            if (point.type === 'M') {
              context.moveTo(...point.d);
            } else if (point.type === 'C') {
              context.bezierCurveTo(...point.d);
            }
          });
          context.setLineDash(dashSwitch[Number(path[path.length - 1].gap)]);
          context.stroke();
        });
      }

      function highlightFlight(highlightId) {
        if (!data) return;

        const highlightedFlight = data.find(elem => elem.id === highlightId);

        let dots = [];
        if (highlightedFlight) {
          dots = highlightedFlight.path.map((point, i) => {
            return {
              id: i,
              cx: point.d[4] || point.d[0],
              cy: point.d[5] || point.d[1],
              price: point.price,
              timeToDepartureDays: point.timeToDepartureDays
            };
          });
          highlightedPoints = dots.length;
          drawCanvas('visible', highlightId);
        } else {
          drawCanvas('visible');
        }

        const t = d3select(dotsG).transition().duration(300);

        d3select(dotsG).selectAll('.dot')
          .data(dots, (d) => d.id)
          .join(
            enter => enter.append('circle')
                      .call(enter => enter.transition(t).delay((d) => d.id * 7)
                        .attr('cx', (d) => +d.cx)
                        .attr('cy', (d) => +d.cy)),
            update => update
                        .call(enter => enter.transition(t)
                          .attr('cx', (d) => +d.cx)
                          .attr('cy', (d) => +d.cy)),
            exit => exit
                      .call(enter => enter.transition(t).delay((d) => (highlightedPoints - d.id) * 7)
                        .attr('cx', 0)
                        .attr('cy', 0)
                        .remove())
          )
          .attr('class', 'dot')
          .attr('fill', '#321321')
          .attr('fill-opacity', 0.6)
          .attr('r', lineWidth * 1.1)
          .on('mouseover', (d) => setTooltip(d.price, d.timeToDepartureDays, d.cx, d.cy))
          .on('mouseout', (d) => setTooltip(null));

          dispatch('flightclick', highlightId);
      }

      function handleClick(e) {
        const col = hiddenCtx.getImageData(e.layerX * sf, e.layerY * sf, 1, 1).data;
        const colorId = `rgb(${col[0]},${col[1]},${col[2]})`;
        const flight = canvasData.find(elem => elem.colorId === colorId);
        if (flight) {
          $$invalidate('highlightId', highlightId = flight.id);
        } else {
          $$invalidate('highlightId', highlightId = null);
        }
      }

      function setTooltip(price, timeToDepartureDays = 0, x = 0, y = 0) {
        if (price === null) {
          $$invalidate('tooltip', tooltip = null);
          return;
        }

        const tooltipWidth = 150;
        const tooltipHeight = 50;
        $$invalidate('tooltip', tooltip = {
          textDays: `${timeToDepartureDays === 1 ? 'final price' : timeToDepartureDays + ' days to departure.'}`,
          textPrice: `${Math.round(price)} €`,
          x: Number(x) - tooltipWidth / 2,
          y: Number(y) + 10,
          width: tooltipWidth,
          height: tooltipHeight
        });
      }

      onMount(() => {
        canvas = d3select(canvasElement);
        ctx = canvas.node().getContext('2d');
        hiddenCanvas = d3select(hiddenCanvasElement);
        hiddenCtx = hiddenCanvas.node().getContext('2d');
      });

    	const writable_props = ['data', 'width', 'height', 'colors'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<RadialCanvas> was created with unknown prop '${key}'`);
    	});

    	function click_handler() {if (highlightId !== null) { highlightId = null; $$invalidate('highlightId', highlightId), $$invalidate('data', data), $$invalidate('canvasData', canvasData); }}

    	function g0_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			$$invalidate('dotsG', dotsG = $$value);
    		});
    	}

    	function click_handler_1(e) {
    		return handleClick(e);
    	}

    	function canvas0_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			$$invalidate('canvasElement', canvasElement = $$value);
    		});
    	}

    	function canvas1_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			$$invalidate('hiddenCanvasElement', hiddenCanvasElement = $$value);
    		});
    	}

    	$$self.$set = $$props => {
    		if ('data' in $$props) $$invalidate('data', data = $$props.data);
    		if ('width' in $$props) $$invalidate('width', width = $$props.width);
    		if ('height' in $$props) $$invalidate('height', height = $$props.height);
    		if ('colors' in $$props) $$invalidate('colors', colors = $$props.colors);
    	};

    	$$self.$$.update = ($$dirty = { width: 1, height: 1, data: 1, highlightId: 1, canvasData: 1 }) => {
    		if ($$dirty.width) { $$invalidate('width', width = width || 0); }
    		if ($$dirty.height) { $$invalidate('height', height = height || 0); }
    		if ($$dirty.width || $$dirty.height) { if (width && height) setupCanvas(); }
    		if ($$dirty.data || $$dirty.highlightId || $$dirty.canvasData) { if (data && data.length > 0) {
            $$invalidate('canvasData', canvasData = renderColorGradients());
            drawCanvas('visible', highlightId);
            drawCanvas('hidden');
            if (!canvasData.map(elem => elem.id).includes(highlightId)) $$invalidate('highlightId', highlightId = null);
          } }
    		if ($$dirty.highlightId) { highlightFlight(highlightId); }
    	};

    	return {
    		data,
    		width,
    		height,
    		colors,
    		canvasElement,
    		hiddenCanvasElement,
    		dotsG,
    		highlightId,
    		tooltip,
    		handleClick,
    		click_handler,
    		g0_binding,
    		click_handler_1,
    		canvas0_binding,
    		canvas1_binding
    	};
    }

    class RadialCanvas extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, ["data", "width", "height", "colors"]);

    		const { ctx } = this.$$;
    		const props = options.props || {};
    		if (ctx.data === undefined && !('data' in props)) {
    			console.warn("<RadialCanvas> was created without expected prop 'data'");
    		}
    		if (ctx.width === undefined && !('width' in props)) {
    			console.warn("<RadialCanvas> was created without expected prop 'width'");
    		}
    		if (ctx.height === undefined && !('height' in props)) {
    			console.warn("<RadialCanvas> was created without expected prop 'height'");
    		}
    		if (ctx.colors === undefined && !('colors' in props)) {
    			console.warn("<RadialCanvas> was created without expected prop 'colors'");
    		}
    	}

    	get data() {
    		throw new Error("<RadialCanvas>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set data(value) {
    		throw new Error("<RadialCanvas>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get width() {
    		throw new Error("<RadialCanvas>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set width(value) {
    		throw new Error("<RadialCanvas>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get height() {
    		throw new Error("<RadialCanvas>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set height(value) {
    		throw new Error("<RadialCanvas>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get colors() {
    		throw new Error("<RadialCanvas>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set colors(value) {
    		throw new Error("<RadialCanvas>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    const timeParser = (datetime) => utcParse('%Y-%m-%dT%I:%M:%SZ')(datetime);

    const formatTime = timeFormat('%Y-%m-%d');

    /* src/RadialGraph/RadialGraph.svelte generated by Svelte v3.7.0 */
    const { Object: Object_1 } = globals;

    const file$3 = "src/RadialGraph/RadialGraph.svelte";

    // (179:2) {#if priceScale && timeRange}
    function create_if_block$2(ctx) {
    	var div, span, t_1, html_tag, raw_value = formatCenterTimeRange(ctx.timeRange);

    	return {
    		c: function create() {
    			div = element("div");
    			span = element("span");
    			span.textContent = "Departure";
    			t_1 = space();
    			attr(span, "class", "pre-string svelte-lijv0r");
    			add_location(span, file$3, 181, 6, 5367);
    			html_tag = new HtmlTag(raw_value, null);
    			attr(div, "class", "selected-time-range svelte-lijv0r");
    			set_style(div, "width", "" + ctx.priceScale(300) + "px");
    			add_location(div, file$3, 179, 4, 5282);
    		},

    		m: function mount(target, anchor) {
    			insert(target, div, anchor);
    			append(div, span);
    			append(div, t_1);
    			html_tag.m(div);
    		},

    		p: function update(changed, ctx) {
    			if ((changed.timeRange) && raw_value !== (raw_value = formatCenterTimeRange(ctx.timeRange))) {
    				html_tag.p(raw_value);
    			}

    			if (changed.priceScale) {
    				set_style(div, "width", "" + ctx.priceScale(300) + "px");
    			}
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(div);
    			}
    		}
    	};
    }

    function create_fragment$3(ctx) {
    	var div, t0, t1, div_resize_listener, current;

    	var coordinates = new Coordinates({
    		props: {
    		priceScale: ctx.priceScale,
    		dayToAngle: ctx.dayToAngle,
    		width: ctx.width - sizeOffset,
    		height: ctx.height - sizeOffset,
    		colors: ctx.colors
    	},
    		$$inline: true
    	});

    	var radialcanvas = new RadialCanvas({
    		props: {
    		data: ctx.slicedData,
    		width: ctx.width - sizeOffset,
    		height: ctx.height - sizeOffset,
    		colors: ctx.colors
    	},
    		$$inline: true
    	});
    	radialcanvas.$on("flightclick", ctx.flightclick_handler);

    	var if_block = (ctx.priceScale && ctx.timeRange) && create_if_block$2(ctx);

    	return {
    		c: function create() {
    			div = element("div");
    			coordinates.$$.fragment.c();
    			t0 = space();
    			radialcanvas.$$.fragment.c();
    			t1 = space();
    			if (if_block) if_block.c();
    			add_render_callback(() => ctx.div_resize_handler.call(div));
    			attr(div, "class", "wrapper svelte-lijv0r");
    			add_location(div, file$3, 167, 0, 4786);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, div, anchor);
    			mount_component(coordinates, div, null);
    			append(div, t0);
    			mount_component(radialcanvas, div, null);
    			append(div, t1);
    			if (if_block) if_block.m(div, null);
    			div_resize_listener = add_resize_listener(div, ctx.div_resize_handler.bind(div));
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var coordinates_changes = {};
    			if (changed.priceScale) coordinates_changes.priceScale = ctx.priceScale;
    			if (changed.dayToAngle) coordinates_changes.dayToAngle = ctx.dayToAngle;
    			if (changed.width || changed.sizeOffset) coordinates_changes.width = ctx.width - sizeOffset;
    			if (changed.height || changed.sizeOffset) coordinates_changes.height = ctx.height - sizeOffset;
    			if (changed.colors) coordinates_changes.colors = ctx.colors;
    			coordinates.$set(coordinates_changes);

    			var radialcanvas_changes = {};
    			if (changed.slicedData) radialcanvas_changes.data = ctx.slicedData;
    			if (changed.width || changed.sizeOffset) radialcanvas_changes.width = ctx.width - sizeOffset;
    			if (changed.height || changed.sizeOffset) radialcanvas_changes.height = ctx.height - sizeOffset;
    			if (changed.colors) radialcanvas_changes.colors = ctx.colors;
    			radialcanvas.$set(radialcanvas_changes);

    			if (ctx.priceScale && ctx.timeRange) {
    				if (if_block) {
    					if_block.p(changed, ctx);
    				} else {
    					if_block = create_if_block$2(ctx);
    					if_block.c();
    					if_block.m(div, null);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(coordinates.$$.fragment, local);

    			transition_in(radialcanvas.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(coordinates.$$.fragment, local);
    			transition_out(radialcanvas.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(div);
    			}

    			destroy_component(coordinates);

    			destroy_component(radialcanvas);

    			if (if_block) if_block.d();
    			div_resize_listener.cancel();
    		}
    	};
    }

    const sizeOffset = 10;

    const days = 30;

    const timeStep = 0.5;

    const daysOnCircle = 35;

    function formatCenterTimeRange(timeRange) {
      const weekday = timeFormat('%a')(timeRange[0]);
      const time1 = timeFormat('%b %d')(timeRange[0]).replace(' ', '&nbsp;');
      const time2 = timeFormat('%d')(timeRange[1]).replace(' ', '&nbsp;');
      return (time1 === timeFormat('%b %d')(timeRange[1]).replace(' ', '&nbsp;')) ? `${weekday}, ${time1}` : `${time1} - ${time2}`;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	

      let { data, timeRange = [], colors } = $$props;
      const pi2 = 2 * Math.PI;
      const dayOffset = -2;

      const line = lineRadial$1()
        .angle(d => d.angle)
        .radius(d => d.radius)
        .curve(curveCatmullRom.alpha(0.5));

      let width, height;
      let maxPrice = 0;
      let priceScale;
      let dataPreCalc;
      let radialDataIndex;
      let slicedData;

      let nextCol = 1;

      function generateColor(){
        let ret = [];
        if(nextCol < 16777215) {
          ret.push(nextCol & 0xff); // R
          ret.push((nextCol & 0xff00) >> 8); // G 
          ret.push((nextCol & 0xff0000) >> 16); // B

          nextCol += 1;
        }
        const col = `rgb(${ret.join(',')})`;
        return col;
      }

      function dayToAngle(day) {
        return -pi2 * day / daysOnCircle + pi2 * dayOffset / daysOnCircle;
      }

      function preCalculateGeometry(dataNested) {
        return dataNested.map(priceLine => {
          let priceLineData = [];
          let endRadius = -100;
          let gapArr = [];
          let previousDay = days;

          priceLine.values.forEach(d => {
            const radius = priceScale(d.price);
            const angle = dayToAngle(d.timeToDepartureDays);

            if (d.timeToDepartureDays === 1) endRadius = radius;

            const point = {
              radius,
              angle,
              price: d.price,
              timeToDepartureDays: d.timeToDepartureDays
            };
            priceLineData.push(point);

            // Keep track of data gaps
            gapArr.push(previousDay - d.timeToDepartureDays > timeStep);
            previousDay = d.timeToDepartureDays;
          });
          
          const minRadius = Math.min(...priceLineData.map(elem => elem.radius));
          const maxRadius = Math.max(...priceLineData.map(elem => elem.radius));
          const middleStop = Math.min((endRadius - minRadius) / (maxRadius - minRadius), 1.0) || 0;

          // Calculate the path for the whole line
          const path = line(priceLineData);
          const objectPath = path.split('C').map((elem, i) =>{
            return {
              type: elem[0] === 'M' ? 'M' : 'C', 
              gap: gapArr[i] || false,
              d: elem.replace('M', '').split(','),
              price: priceLineData[i].price,
              timeToDepartureDays: priceLineData[i].timeToDepartureDays
            };
          });

          return {
            id: priceLine.key,
            path: objectPath,
            minRadius,
            maxRadius,
            endRadius,
            middleStop,
            departure: priceLine.values[0].departure,
            colorId: generateColor()
          };
        });
      }

      function prepareData() {
        maxPrice = d3max(data, d => d.price);
        
        // Define the price scale, i.e. radii
        $$invalidate('priceScale', priceScale = linear$1()
          .domain([0, maxPrice])
          .range([Math.min(width, height) / 11, Math.min(width, height) * 0.5]));

        // Nest the data by unique flights
        const dataNested = nest()
          .key(d => d.flightIdUnique)
          .entries(data);

        // Precalculate geometrical parameters for the whole dataset
        $$invalidate('dataPreCalc', dataPreCalc = preCalculateGeometry(dataNested));

        // build a departure index
        if (dataPreCalc.length > 0) {
          radialDataIndex = {};
          dataPreCalc.forEach((d, index) => {
            const departure = formatTime(d.departure);
            if (!Object.keys(radialDataIndex).includes(departure)) {
              radialDataIndex[departure] = [index];        } else {
              radialDataIndex[departure] = [radialDataIndex[departure][0], index];        }
          });
        }
      }

      function sliceData(timeRange) {
        if (radialDataIndex && timeRange.length === 2) {
          if (timeRange.reduce((a, c) => Math.abs(a - c)) / (1000 * 60 * 60) <= 24) {
            timeRange = [timeRange[0], timeRange[0]];
          }
          const tr = timeRange.map(formatTime);
          const start = radialDataIndex[tr[0]][0];
          const stop = radialDataIndex[tr[1]][1] || radialDataIndex[tr[1]][0];
          $$invalidate('slicedData', slicedData = dataPreCalc.slice(start, stop + 1));
        } else {
          $$invalidate('slicedData', slicedData = dataPreCalc);
        }
      }

    	const writable_props = ['data', 'timeRange', 'colors'];
    	Object_1.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<RadialGraph> was created with unknown prop '${key}'`);
    	});

    	function flightclick_handler(event) {
    		bubble($$self, event);
    	}

    	function div_resize_handler() {
    		width = this.offsetWidth;
    		height = this.offsetHeight;
    		$$invalidate('width', width);
    		$$invalidate('height', height);
    	}

    	$$self.$set = $$props => {
    		if ('data' in $$props) $$invalidate('data', data = $$props.data);
    		if ('timeRange' in $$props) $$invalidate('timeRange', timeRange = $$props.timeRange);
    		if ('colors' in $$props) $$invalidate('colors', colors = $$props.colors);
    	};

    	$$self.$$.update = ($$dirty = { width: 1, height: 1, data: 1, dataPreCalc: 1, timeRange: 1 }) => {
    		if ($$dirty.width || $$dirty.height || $$dirty.data) { if (width && height && data && data.length > 0) prepareData(); }
    		if ($$dirty.dataPreCalc || $$dirty.timeRange) { if (dataPreCalc) sliceData(timeRange); }
    	};

    	return {
    		data,
    		timeRange,
    		colors,
    		width,
    		height,
    		priceScale,
    		slicedData,
    		dayToAngle,
    		flightclick_handler,
    		div_resize_handler
    	};
    }

    class RadialGraph extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, ["data", "timeRange", "colors"]);

    		const { ctx } = this.$$;
    		const props = options.props || {};
    		if (ctx.data === undefined && !('data' in props)) {
    			console.warn("<RadialGraph> was created without expected prop 'data'");
    		}
    		if (ctx.colors === undefined && !('colors' in props)) {
    			console.warn("<RadialGraph> was created without expected prop 'colors'");
    		}
    	}

    	get data() {
    		throw new Error("<RadialGraph>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set data(value) {
    		throw new Error("<RadialGraph>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get timeRange() {
    		throw new Error("<RadialGraph>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set timeRange(value) {
    		throw new Error("<RadialGraph>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get colors() {
    		throw new Error("<RadialGraph>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set colors(value) {
    		throw new Error("<RadialGraph>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/FlightCard/Fin.svelte generated by Svelte v3.7.0 */

    const file$4 = "src/FlightCard/Fin.svelte";

    // (14:40) 
    function create_if_block_1$1(ctx) {
    	var svg, g0, path0, g1, path1;

    	return {
    		c: function create() {
    			svg = svg_element("svg");
    			g0 = svg_element("g");
    			path0 = svg_element("path");
    			g1 = svg_element("g");
    			path1 = svg_element("path");
    			attr(path0, "d", "M557,0,412,376H0L45.9632,357.23952q3.03574-1.23912,5.97062-2.70642l40.54441-20.27222a47.159,47.159,0,0,0,4.87542-2.81329l27.48592-18.129a174.30662,174.30662,0,0,0,31.217-26.31882L411.15042,14.77942A46.73792,46.73792,0,0,1,445.25449,0Z");
    			attr(path0, "class", "svelte-1t852gc");
    			add_location(path0, file$4, 16, 6, 1625);
    			attr(g0, "class", "background");
    			add_location(g0, file$4, 15, 4, 1596);
    			attr(path1, "d", "M47.1993352,0.806896552 L39.9664312,0.806896552 C39.5955131,0.806896552 39.410054,0.986206897 39.410054,0.986206897 L19.4732032,25.0137931 C19.3804736,25.1931034 19.3804736,25.2827586 19.5659327,25.2827586 L22.533278,25.2827586 C22.8114665,25.2827586 22.9041961,25.1931034 22.9041961,25.1034483 L27.1697549,19.8137931 C27.1697549,19.8137931 27.2624844,19.7241379 27.355214,19.7241379 L34.4953884,19.7241379 C34.4953884,19.7241379 34.588118,19.7241379 34.588118,19.8137931 C34.588118,19.9034483 33.568093,25.0137931 33.568093,25.0137931 C33.568093,25.1034483 33.568093,25.2827586 33.8462817,25.2827586 L42.4701288,25.2827586 C42.5628583,25.2827586 42.6555879,25.2827586 42.6555879,25.1034483 L47.4775239,1.07586207 C47.3847943,1.07586207 47.4775239,0.806896552 47.1993352,0.806896552 L47.1993352,0.806896552 Z M34.9590361,17.3034483 L29.3952638,17.3034483 C29.3952638,17.3034483 29.3952638,17.3034483 29.3025342,17.3034483 L29.3025342,17.2137931 L36.7208974,7.97931034 L36.8136269,7.88965517 C36.9063565,7.88965517 36.8136269,7.97931034 36.8136269,7.97931034 L34.9590361,17.3034483 C35.0517657,17.2137931 35.0517657,17.2137931 34.9590361,17.3034483 Z M0.185459077,22.2344827 C0.185459077,22.2344827 0.83456585,20.0827586 0.927295391,20.1724138 C0.927295391,19.8137931 1.11275447,19.7241379 1.29821354,19.9034483 C2.13277939,20.7103448 4.72920648,23.1310344 8.3456585,23.1310344 C12.3330287,23.1310344 12.05484,19.9931034 12.05484,19.5448276 C12.05484,18.2896552 10.3857084,12.1034483 9.92206063,10.4896552 C8.62384711,5.28965517 11.869381,0.537931034 19.5659327,0.537931034 C23.6460324,0.537931034 25.6860822,1.6137931 26.4279185,1.97241379 C26.8915663,2.24137931 26.7988367,2.6 26.7988367,2.6 C26.7988367,2.6 26.335189,4.48275862 26.335189,4.66206897 C26.2424595,4.84137931 26.0570004,4.84137931 25.8715413,4.66206897 C24.6660574,3.94482759 23.2751143,3.13793103 21.1423349,3.13793103 C18.6386373,3.13793103 17.3404238,4.93103448 17.9895305,7.53103448 C18.2677192,8.42758624 19.8441213,14.6137931 20.1223099,15.8689656 C21.2350644,20.3517241 18.0822601,25.7310344 9.55114248,25.7310344 C4.82193602,25.7310344 1.85459077,24.0275862 0.83456585,23.2206897 C0.278188616,22.7724138 0.0927295391,22.5034483 0.185459077,22.2344827 Z M45.5302036,22.3241379 C45.5302036,22.3241379 45.9938513,19.9931034 45.9938513,20.1724138 C46.0865808,19.9034483 46.3647695,19.8137931 46.5502285,19.9931034 C47.4775239,20.8 49.8884919,23.1310344 53.5049439,23.1310344 C57.4923141,23.1310344 57.2141255,19.9931034 57.2141255,19.5448276 C57.2141255,18.2896552 55.5449938,12.1034483 55.0813461,10.4896552 C53.7831325,5.28965517 57.0286664,0.537931034 64.7252181,0.537931034 C68.8053178,0.537931034 70.8453677,1.6137931 71.587204,1.97241379 C72.0508517,2.24137931 71.9581221,2.6 71.9581221,2.6 C71.9581221,2.6 71.4944745,4.48275862 71.4944745,4.66206897 C71.4017449,4.84137931 71.2162858,4.84137931 71.0308267,4.66206897 C69.8253427,3.94482759 68.4343997,3.13793103 66.3016203,3.13793103 C63.7979227,3.13793103 62.4997092,4.93103448 63.1488159,7.53103448 C63.4270046,8.42758624 65.0034068,14.6137931 65.2815953,15.8689656 C66.3943498,20.3517241 63.2415455,25.7310344 54.7104279,25.7310344 C49.9812215,25.7310344 47.1993352,24.1172414 46.1793104,23.3103448 C45.6229331,22.862069 45.437474,22.5931034 45.5302036,22.3241379 Z");
    			attr(path1, "class", "svelte-1t852gc");
    			add_location(path1, file$4, 19, 6, 1951);
    			attr(g1, "class", "logo");
    			attr(g1, "transform", "translate(165 250) scale(3.6)");
    			add_location(g1, file$4, 18, 4, 1886);
    			attr(svg, "viewBox", "0 0 556 376");
    			attr(svg, "class", "sas svelte-1t852gc");
    			add_location(svg, file$4, 14, 2, 1552);
    		},

    		m: function mount(target, anchor) {
    			insert(target, svg, anchor);
    			append(svg, g0);
    			append(g0, path0);
    			append(svg, g1);
    			append(g1, path1);
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(svg);
    			}
    		}
    	};
    }

    // (5:0) {#if (company && company === 'LH')}
    function create_if_block$3(ctx) {
    	var svg, g0, path0, g1, path1;

    	return {
    		c: function create() {
    			svg = svg_element("svg");
    			g0 = svg_element("g");
    			path0 = svg_element("path");
    			g1 = svg_element("g");
    			path1 = svg_element("path");
    			attr(path0, "d", "M557,0,412,376H0L45.9632,357.23952q3.03574-1.23912,5.97062-2.70642l40.54441-20.27222a47.159,47.159,0,0,0,4.87542-2.81329l27.48592-18.129a174.30662,174.30662,0,0,0,31.217-26.31882L411.15042,14.77942A46.73792,46.73792,0,0,1,445.25449,0Z");
    			attr(path0, "class", "svelte-1t852gc");
    			add_location(path0, file$4, 7, 6, 152);
    			attr(g0, "class", "background");
    			add_location(g0, file$4, 6, 4, 123);
    			attr(path1, "d", "M38 19C38 8.474 29.526 0 19 0 8.512 0 0 8.474 0 19c0 10.488 8.512 19 19 19 10.526 0 19-8.512 19-19zm-1.368 0c0 9.69-7.904 17.632-17.632 17.632-9.69 0-17.632-7.941-17.632-17.632C1.368 9.272 9.31 1.368 19 1.368c9.728 0 17.632 7.904 17.632 17.632zm-10.906-1.14c-.418 0-.95 0-1.634.038l.494-.836h.798c2.85 0 4.978.152 6.916.494l.874-.836c-2.166-.38-4.788-.608-7.448-.608h-.646l.418-.798h.722c2.774 0 5.282.228 7.714.684l.912-.874c-2.736-.532-5.662-.797-8.816-.797a45.9 45.9 0 0 0-4.028.19c-1.52 3.267-3.952 5.168-6.688 5.13-1.064-.039-2.395-.494-4.104-1.407l-1.596-.912.494-.456 3.686 1.596.798-.608-7.448-3.382-1.14.874-2.66-1.102.038 1.102c3.572 1.634 5.054 2.546 8.816 5.244 4.902 3.496 9.272 5.396 15.352 6.612l1.596-1.52h-.38c-4.028 0-7.638-1.33-9.728-3.572 1.748-1.064 3.913-1.557 6.916-1.557.798 0 1.938.075 3.002.189l.912-.874a36.194 36.194 0 0 0-4.294-.266 35.23 35.23 0 0 0-2.888.114l.684-.836a43.437 43.437 0 0 1 2.432-.076c2.014 0 3.344.076 4.864.304l.874-.836c-1.596-.265-3.8-.418-5.814-.418z");
    			attr(path1, "class", "svelte-1t852gc");
    			add_location(path1, file$4, 10, 6, 476);
    			attr(g1, "class", "logo");
    			attr(g1, "transform", "translate(245 160) scale(5)");
    			add_location(g1, file$4, 9, 4, 413);
    			attr(svg, "viewBox", "0 0 556 376");
    			attr(svg, "class", "lh svelte-1t852gc");
    			add_location(svg, file$4, 5, 2, 80);
    		},

    		m: function mount(target, anchor) {
    			insert(target, svg, anchor);
    			append(svg, g0);
    			append(g0, path0);
    			append(svg, g1);
    			append(g1, path1);
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(svg);
    			}
    		}
    	};
    }

    function create_fragment$4(ctx) {
    	var if_block_anchor;

    	function select_block_type(ctx) {
    		if ((ctx.company && ctx.company === 'LH')) return create_if_block$3;
    		if ((ctx.company && ctx.company === 'SK')) return create_if_block_1$1;
    	}

    	var current_block_type = select_block_type(ctx);
    	var if_block = current_block_type && current_block_type(ctx);

    	return {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert(target, if_block_anchor, anchor);
    		},

    		p: function update(changed, ctx) {
    			if (current_block_type !== (current_block_type = select_block_type(ctx))) {
    				if (if_block) if_block.d(1);
    				if_block = current_block_type && current_block_type(ctx);
    				if (if_block) {
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			}
    		},

    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);

    			if (detaching) {
    				detach(if_block_anchor);
    			}
    		}
    	};
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let { company } = $$props;

    	const writable_props = ['company'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<Fin> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ('company' in $$props) $$invalidate('company', company = $$props.company);
    	};

    	return { company };
    }

    class Fin extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, ["company"]);

    		const { ctx } = this.$$;
    		const props = options.props || {};
    		if (ctx.company === undefined && !('company' in props)) {
    			console.warn("<Fin> was created without expected prop 'company'");
    		}
    	}

    	get company() {
    		throw new Error("<Fin>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set company(value) {
    		throw new Error("<Fin>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/FlightCard/FlightCard.svelte generated by Svelte v3.7.0 */

    const file$5 = "src/FlightCard/FlightCard.svelte";

    // (13:0) {#if data}
    function create_if_block$4(ctx) {
    	var div2, div0, span0, t1_value = ctx.data.flightId, t1, br0, t2, span1, t4_value = ctx.timeFormatter(ctx.data.departure), t4, br1, t5, span2, t7_value = ctx.timeFormatter(ctx.data.arrival), t7, br2, t8, span3, t10_value = Math.round(ctx.data.endPrice), t10, t11, t12, div1, div2_transition, current;

    	var fin = new Fin({
    		props: { company: ctx.data.company },
    		$$inline: true
    	});

    	return {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			span0 = element("span");
    			span0.textContent = "Flight";
    			t1 = text(t1_value);
    			br0 = element("br");
    			t2 = space();
    			span1 = element("span");
    			span1.textContent = "Departure";
    			t4 = text(t4_value);
    			br1 = element("br");
    			t5 = space();
    			span2 = element("span");
    			span2.textContent = "Arrival";
    			t7 = text(t7_value);
    			br2 = element("br");
    			t8 = space();
    			span3 = element("span");
    			span3.textContent = "Final price";
    			t10 = text(t10_value);
    			t11 = text(" €");
    			t12 = space();
    			div1 = element("div");
    			fin.$$.fragment.c();
    			attr(span0, "class", "svelte-1xjco0m");
    			add_location(span0, file$5, 15, 6, 304);
    			add_location(br0, file$5, 15, 40, 338);
    			attr(span1, "class", "svelte-1xjco0m");
    			add_location(span1, file$5, 16, 6, 351);
    			add_location(br1, file$5, 16, 59, 404);
    			attr(span2, "class", "svelte-1xjco0m");
    			add_location(span2, file$5, 17, 6, 417);
    			add_location(br2, file$5, 17, 55, 466);
    			attr(span3, "class", "svelte-1xjco0m");
    			add_location(span3, file$5, 18, 6, 479);
    			attr(div0, "class", "info svelte-1xjco0m");
    			add_location(div0, file$5, 14, 4, 279);
    			attr(div1, "class", "fin svelte-1xjco0m");
    			add_location(div1, file$5, 20, 4, 548);
    			attr(div2, "class", "wrapper svelte-1xjco0m");
    			add_location(div2, file$5, 13, 2, 216);
    		},

    		m: function mount(target, anchor) {
    			insert(target, div2, anchor);
    			append(div2, div0);
    			append(div0, span0);
    			append(div0, t1);
    			append(div0, br0);
    			append(div0, t2);
    			append(div0, span1);
    			append(div0, t4);
    			append(div0, br1);
    			append(div0, t5);
    			append(div0, span2);
    			append(div0, t7);
    			append(div0, br2);
    			append(div0, t8);
    			append(div0, span3);
    			append(div0, t10);
    			append(div0, t11);
    			append(div2, t12);
    			append(div2, div1);
    			mount_component(fin, div1, null);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			if ((!current || changed.data) && t1_value !== (t1_value = ctx.data.flightId)) {
    				set_data(t1, t1_value);
    			}

    			if ((!current || changed.data) && t4_value !== (t4_value = ctx.timeFormatter(ctx.data.departure))) {
    				set_data(t4, t4_value);
    			}

    			if ((!current || changed.data) && t7_value !== (t7_value = ctx.timeFormatter(ctx.data.arrival))) {
    				set_data(t7, t7_value);
    			}

    			if ((!current || changed.data) && t10_value !== (t10_value = Math.round(ctx.data.endPrice))) {
    				set_data(t10, t10_value);
    			}

    			var fin_changes = {};
    			if (changed.data) fin_changes.company = ctx.data.company;
    			fin.$set(fin_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(fin.$$.fragment, local);

    			add_render_callback(() => {
    				if (!div2_transition) div2_transition = create_bidirectional_transition(div2, fade, { duration: 200}, true);
    				div2_transition.run(1);
    			});

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(fin.$$.fragment, local);

    			if (!div2_transition) div2_transition = create_bidirectional_transition(div2, fade, { duration: 200}, false);
    			div2_transition.run(0);

    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(div2);
    			}

    			destroy_component(fin);

    			if (detaching) {
    				if (div2_transition) div2_transition.end();
    			}
    		}
    	};
    }

    function create_fragment$5(ctx) {
    	var if_block_anchor, current;

    	var if_block = (ctx.data) && create_if_block$4(ctx);

    	return {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert(target, if_block_anchor, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			if (ctx.data) {
    				if (if_block) {
    					if_block.p(changed, ctx);
    					transition_in(if_block, 1);
    				} else {
    					if_block = create_if_block$4(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				group_outros();
    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});
    				check_outros();
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);

    			if (detaching) {
    				detach(if_block_anchor);
    			}
    		}
    	};
    }

    function instance$5($$self, $$props, $$invalidate) {
    	

      let { data } = $$props;
      
      const timeFormatter = timeFormat('%H:%M');

    	const writable_props = ['data'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<FlightCard> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ('data' in $$props) $$invalidate('data', data = $$props.data);
    	};

    	return { data, timeFormatter };
    }

    class FlightCard extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, ["data"]);

    		const { ctx } = this.$$;
    		const props = options.props || {};
    		if (ctx.data === undefined && !('data' in props)) {
    			console.warn("<FlightCard> was created without expected prop 'data'");
    		}
    	}

    	get data() {
    		throw new Error("<FlightCard>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set data(value) {
    		throw new Error("<FlightCard>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/TimeBrush/TimeBrush.svelte generated by Svelte v3.7.0 */

    const file$6 = "src/TimeBrush/TimeBrush.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = Object.create(ctx);
    	child_ctx.departure = list[i].departure;
    	child_ctx.show = list[i].show;
    	child_ctx.id = list[i].id;
    	child_ctx.i = i;
    	return child_ctx;
    }

    // (150:2) {#if path}
    function create_if_block$5(ctx) {
    	var svg, g0, each_blocks = [], each_1_lookup = new Map(), g0_transform_value, g1, path_1, path_1_stroke_width_value;

    	var each_value = ctx.ticks;

    	const get_key = ctx => ctx.id;

    	for (var i = 0; i < each_value.length; i += 1) {
    		let child_ctx = get_each_context$1(ctx, each_value, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block$1(key, child_ctx));
    	}

    	return {
    		c: function create() {
    			svg = svg_element("svg");
    			g0 = svg_element("g");

    			for (i = 0; i < each_blocks.length; i += 1) each_blocks[i].c();

    			g1 = svg_element("g");
    			path_1 = svg_element("path");
    			attr(g0, "class", "axis");
    			attr(g0, "transform", g0_transform_value = "translate(0 " + (ctx.height * shrinkingFactor - ctx.padding.bottom) + ")");
    			add_location(g0, file$6, 151, 6, 4267);
    			attr(path_1, "class", "end-price-line svelte-mr6ttt");
    			attr(path_1, "stroke-width", path_1_stroke_width_value = Math.max(ctx.width, ctx.height * shrinkingFactor) / 700);
    			attr(path_1, "d", ctx.path);
    			add_location(path_1, file$6, 162, 8, 4737);
    			attr(g1, "class", "end-price svelte-mr6ttt");
    			attr(g1, "transform", "translate(0 -10)");
    			add_location(g1, file$6, 161, 6, 4678);
    			attr(svg, "class", "svelte-mr6ttt");
    			add_location(svg, file$6, 150, 4, 4232);
    		},

    		m: function mount(target, anchor) {
    			insert(target, svg, anchor);
    			append(svg, g0);

    			for (i = 0; i < each_blocks.length; i += 1) each_blocks[i].m(g0, null);

    			append(svg, g1);
    			append(g1, path_1);
    			ctx.svg_binding(svg);
    		},

    		p: function update(changed, ctx) {
    			const each_value = ctx.ticks;
    			each_blocks = update_keyed_each(each_blocks, changed, get_key, 1, ctx, each_value, each_1_lookup, g0, destroy_block, create_each_block$1, null, get_each_context$1);

    			if ((changed.height) && g0_transform_value !== (g0_transform_value = "translate(0 " + (ctx.height * shrinkingFactor - ctx.padding.bottom) + ")")) {
    				attr(g0, "transform", g0_transform_value);
    			}

    			if ((changed.width || changed.height) && path_1_stroke_width_value !== (path_1_stroke_width_value = Math.max(ctx.width, ctx.height * shrinkingFactor) / 700)) {
    				attr(path_1, "stroke-width", path_1_stroke_width_value);
    			}

    			if (changed.path) {
    				attr(path_1, "d", ctx.path);
    			}
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(svg);
    			}

    			for (i = 0; i < each_blocks.length; i += 1) each_blocks[i].d();

    			ctx.svg_binding(null);
    		}
    	};
    }

    // (154:10) {#if show}
    function create_if_block_1$2(ctx) {
    	var g, circle, text_1, t_value = timeFormat('%b %d')(ctx.departure), t, g_transform_value;

    	return {
    		c: function create() {
    			g = svg_element("g");
    			circle = svg_element("circle");
    			text_1 = svg_element("text");
    			t = text(t_value);
    			attr(circle, "cx", 0);
    			attr(circle, "cy", -12);
    			attr(circle, "r", "2");
    			attr(circle, "class", "svelte-mr6ttt");
    			add_location(circle, file$6, 155, 14, 4512);
    			attr(text_1, "class", "svelte-mr6ttt");
    			add_location(text_1, file$6, 156, 14, 4566);
    			attr(g, "class", "tick svelte-mr6ttt");
    			attr(g, "transform", g_transform_value = "translate(" + ctx.x(ctx.departure) + " 0)");
    			add_location(g, file$6, 154, 12, 4441);
    		},

    		m: function mount(target, anchor) {
    			insert(target, g, anchor);
    			append(g, circle);
    			append(g, text_1);
    			append(text_1, t);
    		},

    		p: function update(changed, ctx) {
    			if ((changed.ticks) && t_value !== (t_value = timeFormat('%b %d')(ctx.departure))) {
    				set_data(t, t_value);
    			}

    			if ((changed.x || changed.ticks) && g_transform_value !== (g_transform_value = "translate(" + ctx.x(ctx.departure) + " 0)")) {
    				attr(g, "transform", g_transform_value);
    			}
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(g);
    			}
    		}
    	};
    }

    // (153:8) {#each ticks as {departure, show, id}
    function create_each_block$1(key_1, ctx) {
    	var first, if_block_anchor;

    	var if_block = (ctx.show) && create_if_block_1$2(ctx);

    	return {
    		key: key_1,

    		first: null,

    		c: function create() {
    			first = empty();
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    			this.first = first;
    		},

    		m: function mount(target, anchor) {
    			insert(target, first, anchor);
    			if (if_block) if_block.m(target, anchor);
    			insert(target, if_block_anchor, anchor);
    		},

    		p: function update(changed, ctx) {
    			if (ctx.show) {
    				if (if_block) {
    					if_block.p(changed, ctx);
    				} else {
    					if_block = create_if_block_1$2(ctx);
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(first);
    			}

    			if (if_block) if_block.d(detaching);

    			if (detaching) {
    				detach(if_block_anchor);
    			}
    		}
    	};
    }

    function create_fragment$6(ctx) {
    	var div6, div5, div0, t1, div1, t3, div2, t5, div3, t7, div4, t9, div6_resize_listener, dispose;

    	var if_block = (ctx.path) && create_if_block$5(ctx);

    	return {
    		c: function create() {
    			div6 = element("div");
    			div5 = element("div");
    			div0 = element("div");
    			div0.textContent = "Final prices per departure date in";
    			t1 = space();
    			div1 = element("div");
    			div1.textContent = "April";
    			t3 = space();
    			div2 = element("div");
    			div2.textContent = "May";
    			t5 = space();
    			div3 = element("div");
    			div3.textContent = "June";
    			t7 = space();
    			div4 = element("div");
    			div4.textContent = "2019";
    			t9 = space();
    			if (if_block) if_block.c();
    			attr(div0, "class", "label svelte-mr6ttt");
    			add_location(div0, file$6, 143, 4, 3773);
    			attr(div1, "class", "month-selector svelte-mr6ttt");
    			toggle_class(div1, "active", ctx.selectedMonth === 3);
    			add_location(div1, file$6, 144, 4, 3837);
    			attr(div2, "class", "month-selector svelte-mr6ttt");
    			toggle_class(div2, "active", ctx.selectedMonth === 4);
    			add_location(div2, file$6, 145, 4, 3951);
    			attr(div3, "class", "month-selector svelte-mr6ttt");
    			toggle_class(div3, "active", ctx.selectedMonth === 5);
    			add_location(div3, file$6, 146, 4, 4063);
    			attr(div4, "class", "label svelte-mr6ttt");
    			add_location(div4, file$6, 147, 4, 4176);
    			attr(div5, "class", "top-line svelte-mr6ttt");
    			add_location(div5, file$6, 142, 2, 3746);
    			add_render_callback(() => ctx.div6_resize_handler.call(div6));
    			attr(div6, "class", "wrapper svelte-mr6ttt");
    			add_location(div6, file$6, 141, 0, 3670);

    			dispose = [
    				listen(div1, "click", ctx.click_handler),
    				listen(div2, "click", ctx.click_handler_1),
    				listen(div3, "click", ctx.click_handler_2)
    			];
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, div6, anchor);
    			append(div6, div5);
    			append(div5, div0);
    			append(div5, t1);
    			append(div5, div1);
    			append(div5, t3);
    			append(div5, div2);
    			append(div5, t5);
    			append(div5, div3);
    			append(div5, t7);
    			append(div5, div4);
    			append(div6, t9);
    			if (if_block) if_block.m(div6, null);
    			div6_resize_listener = add_resize_listener(div6, ctx.div6_resize_handler.bind(div6));
    		},

    		p: function update(changed, ctx) {
    			if (changed.selectedMonth) {
    				toggle_class(div1, "active", ctx.selectedMonth === 3);
    				toggle_class(div2, "active", ctx.selectedMonth === 4);
    				toggle_class(div3, "active", ctx.selectedMonth === 5);
    			}

    			if (ctx.path) {
    				if (if_block) {
    					if_block.p(changed, ctx);
    				} else {
    					if_block = create_if_block$5(ctx);
    					if_block.c();
    					if_block.m(div6, null);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},

    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(div6);
    			}

    			if (if_block) if_block.d();
    			div6_resize_listener.cancel();
    			run_all(dispose);
    		}
    	};
    }

    const shrinkingFactor = 0.75;

    function instance$6($$self, $$props, $$invalidate) {
    	

      let { data, colors } = $$props;
      const dispatch = createEventDispatcher();
      const padding = {
        top: 20,
        bottom: 10
      };

      let dataMonth;
      let width, height;
      let svgElement;
      let x, y;
      let line;
      let path;
      let ticks;
      let brush;
      let isInit = true;
      let selectedMonth;
      let lastDays = {
        3: [timeParser('2019-04-24T00:00:00Z'), timeParser('2019-04-25T00:00:00Z')],
        4: [timeParser('2019-05-24T00:00:00Z'), timeParser('2019-05-25T00:00:00Z')],
        5: [timeParser('2019-06-24T00:00:00Z'), timeParser('2019-06-25T00:00:00Z')]
      };

      function buildBrush() {
        d3select(svgElement).selectAll('g.brush').remove();

        brush = brushX()
          .extent([[0, 0], [width, height * shrinkingFactor]])
          .on('brush end', brushed);

        d3select(svgElement).append('g')
          .attr('class', 'brush')
          .call(brush)
          .call(brush.move,
            [x(lastDays[selectedMonth][0]), x(lastDays[selectedMonth][1])]);
      }

      function brushed() {
        if (!isInit && !event.sourceEvent || !event.selection) return;
        isInit = false;
        
        const selectionX = event.selection;
        let selectionTime = selectionX.map(x.invert);

        let selectionTimeRounded = selectionTime.map(day.round);

        if (selectionTimeRounded[0] >= selectionTimeRounded[1]) {
          selectionTimeRounded[0] = day.floor(selectionTime[0]);
          selectionTimeRounded[1] = day.offset(selectionTimeRounded[0]);
        }

        if (selectionTimeRounded[1] > x.domain()[1]) {
          selectionTimeRounded[1] = x.domain()[1];
        }

        // Subtract a few milliseconds to get to the day before
        selectionTimeRounded[1] = new Date(selectionTimeRounded[1] - 100);

        if (event.type === 'end') {
          d3select(this).transition().call(event.target.move, selectionTimeRounded.map(x));
        }

        if (lastDays[selectedMonth].toString() !== selectionTimeRounded.toString()) {
          lastDays[selectedMonth] = [selectionTimeRounded[0], selectionTimeRounded[1]];      dispatch('timerangeselected', selectionTimeRounded);
        }
      }

      function selectMonth(month) {
        if (!month) return;
        isInit = true;
        $$invalidate('dataMonth', dataMonth = data.filter(elem => elem.departure.getMonth() === month));
        dispatch('timerangeselected', lastDays[selectedMonth]);
      }

      onMount(() => {
        $$invalidate('selectedMonth', selectedMonth = 3);
      });

    	const writable_props = ['data', 'colors'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<TimeBrush> was created with unknown prop '${key}'`);
    	});

    	function click_handler() {
    		const $$result = selectedMonth = 3;
    		$$invalidate('selectedMonth', selectedMonth);
    		return $$result;
    	}

    	function click_handler_1() {
    		const $$result = selectedMonth = 4;
    		$$invalidate('selectedMonth', selectedMonth);
    		return $$result;
    	}

    	function click_handler_2() {
    		const $$result = selectedMonth = 5;
    		$$invalidate('selectedMonth', selectedMonth);
    		return $$result;
    	}

    	function svg_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			$$invalidate('svgElement', svgElement = $$value);
    		});
    	}

    	function div6_resize_handler() {
    		width = this.offsetWidth;
    		height = this.offsetHeight;
    		$$invalidate('width', width);
    		$$invalidate('height', height);
    	}

    	$$self.$set = $$props => {
    		if ('data' in $$props) $$invalidate('data', data = $$props.data);
    		if ('colors' in $$props) $$invalidate('colors', colors = $$props.colors);
    	};

    	$$self.$$.update = ($$dirty = { selectedMonth: 1, dataMonth: 1, width: 1, height: 1, data: 1, x: 1, y: 1, line: 1, ticks: 1, svgElement: 1 }) => {
    		if ($$dirty.selectedMonth) { selectMonth(selectedMonth); }
    		if ($$dirty.dataMonth || $$dirty.width || $$dirty.height || $$dirty.data || $$dirty.x || $$dirty.y || $$dirty.line || $$dirty.ticks) { if (dataMonth && dataMonth.length > 0 && width && height) {
            $$invalidate('x', x = scaleTime()
              .domain(extent(dataMonth, d => d.departure))
              .range([0, width]));
        
            $$invalidate('y', y = linear$1()
              .domain([0, d3max(data, d => d.endPrice)])
              .range([height * shrinkingFactor, padding.top]));
        
            $$invalidate('line', line = d3line()
              .x(d => x(d.departure))
              .y(d => y(d.endPrice))
              .curve(monotoneX));
            
            $$invalidate('path', path = line(dataMonth));
        
            const tickInterval = 3;
            let lastTime = dataMonth[0].departure;
            $$invalidate('ticks', ticks = dataMonth.map(({ departure }, index) => {
              let show;
              if ((departure - lastTime) / (1000 * 60 * 60 * 24) >= tickInterval) {
                lastTime = departure;
                show = true;
              } else {
                show = false;
              }
              return {
                id: index,
                departure,
                show
              };
            }));
            $$invalidate('ticks', ticks = ticks.slice(3, -3));
          } }
    		if ($$dirty.x || $$dirty.svgElement) { if (x && svgElement) buildBrush(); }
    	};

    	return {
    		data,
    		colors,
    		padding,
    		width,
    		height,
    		svgElement,
    		x,
    		path,
    		ticks,
    		selectedMonth,
    		click_handler,
    		click_handler_1,
    		click_handler_2,
    		svg_binding,
    		div6_resize_handler
    	};
    }

    class TimeBrush extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, ["data", "colors"]);

    		const { ctx } = this.$$;
    		const props = options.props || {};
    		if (ctx.data === undefined && !('data' in props)) {
    			console.warn("<TimeBrush> was created without expected prop 'data'");
    		}
    		if (ctx.colors === undefined && !('colors' in props)) {
    			console.warn("<TimeBrush> was created without expected prop 'colors'");
    		}
    	}

    	get data() {
    		throw new Error("<TimeBrush>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set data(value) {
    		throw new Error("<TimeBrush>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get colors() {
    		throw new Error("<TimeBrush>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set colors(value) {
    		throw new Error("<TimeBrush>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/App.svelte generated by Svelte v3.7.0 */

    const file$7 = "src/App.svelte";

    // (1:0) <script>   import Legend from './Legend/Legend.svelte';   import RadialGraph from './RadialGraph/RadialGraph.svelte';   import FlightCard from './FlightCard/FlightCard.svelte';   import TimeBrush from './TimeBrush/TimeBrush.svelte';    import { onMount }
    function create_catch_block_2(ctx) {
    	return {
    		c: noop,
    		m: noop,
    		p: noop,
    		i: noop,
    		o: noop,
    		d: noop
    	};
    }

    // (86:72)          <RadialGraph data={data}
    function create_then_block_2(ctx) {
    	var current;

    	var radialgraph = new RadialGraph({
    		props: {
    		data: ctx.data,
    		timeRange: ctx.timeRange,
    		colors: ctx.colors
    	},
    		$$inline: true
    	});
    	radialgraph.$on("flightclick", ctx.flightclick_handler);

    	return {
    		c: function create() {
    			radialgraph.$$.fragment.c();
    		},

    		m: function mount(target, anchor) {
    			mount_component(radialgraph, target, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var radialgraph_changes = {};
    			if (changed.data) radialgraph_changes.data = ctx.data;
    			if (changed.timeRange) radialgraph_changes.timeRange = ctx.timeRange;
    			if (changed.colors) radialgraph_changes.colors = ctx.colors;
    			radialgraph.$set(radialgraph_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(radialgraph.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(radialgraph.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			destroy_component(radialgraph, detaching);
    		}
    	};
    }

    // (1:0) <script>   import Legend from './Legend/Legend.svelte';   import RadialGraph from './RadialGraph/RadialGraph.svelte';   import FlightCard from './FlightCard/FlightCard.svelte';   import TimeBrush from './TimeBrush/TimeBrush.svelte';    import { onMount }
    function create_pending_block_2(ctx) {
    	return {
    		c: noop,
    		m: noop,
    		p: noop,
    		i: noop,
    		o: noop,
    		d: noop
    	};
    }

    // (1:0) <script>   import Legend from './Legend/Legend.svelte';   import RadialGraph from './RadialGraph/RadialGraph.svelte';   import FlightCard from './FlightCard/FlightCard.svelte';   import TimeBrush from './TimeBrush/TimeBrush.svelte';    import { onMount }
    function create_catch_block_1(ctx) {
    	return {
    		c: noop,
    		m: noop,
    		p: noop,
    		i: noop,
    		o: noop,
    		d: noop
    	};
    }

    // (99:75)          <FlightCard data={data.find(elem => elem.flightIdUnique === highlightedFlightId)}
    function create_then_block_1(ctx) {
    	var current;

    	var flightcard = new FlightCard({
    		props: { data: ctx.data.find(ctx.func_2) },
    		$$inline: true
    	});

    	return {
    		c: function create() {
    			flightcard.$$.fragment.c();
    		},

    		m: function mount(target, anchor) {
    			mount_component(flightcard, target, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var flightcard_changes = {};
    			if (changed.data || changed.highlightedFlightId) flightcard_changes.data = ctx.data.find(ctx.func_2);
    			flightcard.$set(flightcard_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(flightcard.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(flightcard.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			destroy_component(flightcard, detaching);
    		}
    	};
    }

    // (1:0) <script>   import Legend from './Legend/Legend.svelte';   import RadialGraph from './RadialGraph/RadialGraph.svelte';   import FlightCard from './FlightCard/FlightCard.svelte';   import TimeBrush from './TimeBrush/TimeBrush.svelte';    import { onMount }
    function create_pending_block_1(ctx) {
    	return {
    		c: noop,
    		m: noop,
    		p: noop,
    		i: noop,
    		o: noop,
    		d: noop
    	};
    }

    // (1:0) <script>   import Legend from './Legend/Legend.svelte';   import RadialGraph from './RadialGraph/RadialGraph.svelte';   import FlightCard from './FlightCard/FlightCard.svelte';   import TimeBrush from './TimeBrush/TimeBrush.svelte';    import { onMount }
    function create_catch_block(ctx) {
    	return {
    		c: noop,
    		m: noop,
    		p: noop,
    		i: noop,
    		o: noop,
    		d: noop
    	};
    }

    // (106:75)          <TimeBrush data={data}
    function create_then_block(ctx) {
    	var current;

    	var timebrush = new TimeBrush({
    		props: {
    		data: ctx.data,
    		colors: ctx.colors
    	},
    		$$inline: true
    	});
    	timebrush.$on("timerangeselected", ctx.timerangeselected_handler);

    	return {
    		c: function create() {
    			timebrush.$$.fragment.c();
    		},

    		m: function mount(target, anchor) {
    			mount_component(timebrush, target, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var timebrush_changes = {};
    			if (changed.data) timebrush_changes.data = ctx.data;
    			if (changed.colors) timebrush_changes.colors = ctx.colors;
    			timebrush.$set(timebrush_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(timebrush.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(timebrush.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			destroy_component(timebrush, detaching);
    		}
    	};
    }

    // (1:0) <script>   import Legend from './Legend/Legend.svelte';   import RadialGraph from './RadialGraph/RadialGraph.svelte';   import FlightCard from './FlightCard/FlightCard.svelte';   import TimeBrush from './TimeBrush/TimeBrush.svelte';    import { onMount }
    function create_pending_block(ctx) {
    	return {
    		c: noop,
    		m: noop,
    		p: noop,
    		i: noop,
    		o: noop,
    		d: noop
    	};
    }

    function create_fragment$7(ctx) {
    	var t0, div8, div0, h1, t2, h3, t4, div2, div1, promise, t5, div5, div3, t6, div4, promise_1, t7, div7, div6, promise_2, current, dispose;

    	add_render_callback(ctx.onwindowresize);

    	let info = {
    		ctx,
    		current: null,
    		token: null,
    		pending: create_pending_block_2,
    		then: create_then_block_2,
    		catch: create_catch_block_2,
    		value: 'data',
    		error: 'null',
    		blocks: [,,,]
    	};

    	handle_promise(promise = ctx.data.find(func).data, info);

    	var legend = new Legend({ $$inline: true });

    	let info_1 = {
    		ctx,
    		current: null,
    		token: null,
    		pending: create_pending_block_1,
    		then: create_then_block_1,
    		catch: create_catch_block_1,
    		value: 'data',
    		error: 'null',
    		blocks: [,,,]
    	};

    	handle_promise(promise_1 = ctx.data.find(func_1).data, info_1);

    	let info_2 = {
    		ctx,
    		current: null,
    		token: null,
    		pending: create_pending_block,
    		then: create_then_block,
    		catch: create_catch_block,
    		value: 'data',
    		error: 'null',
    		blocks: [,,,]
    	};

    	handle_promise(promise_2 = ctx.data.find(func_3).data, info_2);

    	return {
    		c: function create() {
    			t0 = space();
    			div8 = element("div");
    			div0 = element("div");
    			h1 = element("h1");
    			h1.textContent = "30 days to takeoff";
    			t2 = space();
    			h3 = element("h3");
    			h3.textContent = "Following thousands of flight prices starting a month before departure.";
    			t4 = space();
    			div2 = element("div");
    			div1 = element("div");

    			info.block.c();

    			t5 = space();
    			div5 = element("div");
    			div3 = element("div");
    			legend.$$.fragment.c();
    			t6 = space();
    			div4 = element("div");

    			info_1.block.c();

    			t7 = space();
    			div7 = element("div");
    			div6 = element("div");

    			info_2.block.c();
    			attr(h1, "class", "svelte-ryow9b");
    			add_location(h1, file$7, 80, 4, 2148);
    			attr(h3, "class", "svelte-ryow9b");
    			add_location(h3, file$7, 81, 4, 2180);
    			attr(div0, "class", "title-bar svelte-ryow9b");
    			add_location(div0, file$7, 79, 2, 2120);
    			attr(div1, "class", "container radial-graph svelte-ryow9b");
    			add_location(div1, file$7, 84, 4, 2302);
    			attr(div2, "class", "top-wrapper svelte-ryow9b");
    			add_location(div2, file$7, 83, 2, 2272);
    			attr(div3, "class", "left legend svelte-ryow9b");
    			add_location(div3, file$7, 94, 4, 2668);
    			attr(div4, "class", "right svelte-ryow9b");
    			add_location(div4, file$7, 97, 4, 2726);
    			attr(div5, "class", "info-bar svelte-ryow9b");
    			add_location(div5, file$7, 93, 2, 2641);
    			attr(div6, "class", "container time-brush svelte-ryow9b");
    			add_location(div6, file$7, 104, 4, 2978);
    			attr(div7, "class", "time-bar svelte-ryow9b");
    			add_location(div7, file$7, 103, 2, 2951);
    			attr(div8, "class", "outer-wrapper svelte-ryow9b");
    			add_location(div8, file$7, 78, 0, 2090);
    			dispose = listen(window, "resize", ctx.onwindowresize);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, t0, anchor);
    			insert(target, div8, anchor);
    			append(div8, div0);
    			append(div0, h1);
    			append(div0, t2);
    			append(div0, h3);
    			append(div8, t4);
    			append(div8, div2);
    			append(div2, div1);

    			info.block.m(div1, info.anchor = null);
    			info.mount = () => div1;
    			info.anchor = null;

    			append(div8, t5);
    			append(div8, div5);
    			append(div5, div3);
    			mount_component(legend, div3, null);
    			append(div5, t6);
    			append(div5, div4);

    			info_1.block.m(div4, info_1.anchor = null);
    			info_1.mount = () => div4;
    			info_1.anchor = null;

    			append(div8, t7);
    			append(div8, div7);
    			append(div7, div6);

    			info_2.block.m(div6, info_2.anchor = null);
    			info_2.mount = () => div6;
    			info_2.anchor = null;

    			current = true;
    		},

    		p: function update(changed, new_ctx) {
    			ctx = new_ctx;
    			info.ctx = ctx;

    			if (('data' in changed) && promise !== (promise = ctx.data.find(func).data) && handle_promise(promise, info)) ; else {
    				info.block.p(changed, assign(assign({}, ctx), info.resolved));
    			}

    			info_1.ctx = ctx;

    			if (('data' in changed) && promise_1 !== (promise_1 = ctx.data.find(func_1).data) && handle_promise(promise_1, info_1)) ; else {
    				info_1.block.p(changed, assign(assign({}, ctx), info_1.resolved));
    			}

    			info_2.ctx = ctx;

    			if (('data' in changed) && promise_2 !== (promise_2 = ctx.data.find(func_3).data) && handle_promise(promise_2, info_2)) ; else {
    				info_2.block.p(changed, assign(assign({}, ctx), info_2.resolved));
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(info.block);

    			transition_in(legend.$$.fragment, local);

    			transition_in(info_1.block);
    			transition_in(info_2.block);
    			current = true;
    		},

    		o: function outro(local) {
    			for (let i = 0; i < 3; i += 1) {
    				const block = info.blocks[i];
    				transition_out(block);
    			}

    			transition_out(legend.$$.fragment, local);

    			for (let i = 0; i < 3; i += 1) {
    				const block = info_1.blocks[i];
    				transition_out(block);
    			}

    			for (let i = 0; i < 3; i += 1) {
    				const block = info_2.blocks[i];
    				transition_out(block);
    			}

    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(t0);
    				detach(div8);
    			}

    			info.block.d();
    			info.token = null;
    			info = null;

    			destroy_component(legend);

    			info_1.block.d();
    			info_1.token = null;
    			info_1 = null;

    			info_2.block.d();
    			info_2.token = null;
    			info_2 = null;

    			dispose();
    		}
    	};
    }

    function func(elem) {
    	return elem.name === 'flights';
    }

    function func_1(elem) {
    	return elem.name === 'flightInfo';
    }

    function func_3(elem) {
    	return elem.name === 'flightInfo';
    }

    function instance$7($$self, $$props, $$invalidate) {
    	

      // Define the data sources and define formatting callbacks
      const dataPaths = [
        {
          name: 'flightInfo',
          path: 'data/flight_info.csv',
          callback: function (d) {
            return {
              ...d,
              arrival: timeParser(d.arrival),
              departure: timeParser(d.departure),
              departureRounded: timeParser(d.departureRounded),
              meanPrice: +d.meanPrice,
              medianPrice: +d.medianPrice,
              sumPrice: +d.sumPrice,
              sdPrice: +d.sdPrice,
              endPrice: isNaN(+d.endPrice) ? 0 : +d.endPrice
            };
          }
        },
        {
          name: 'flights',
          path: 'data/flights_by_day_to_departure.csv',
          callback: function (d) {
            return {
              ...d,
              price: parseFloat(d.price),
              timeToDepartureDays: +d.timeToDepartureDays,
              departure: timeParser(d.departure)
            };
          }
        }
      ];

      // Setup the colors
      const colors = {
        lowPrice: '#2274A5',
        endPrice: '#E3D8F1',
        highPrice: '#EF6461',
        lightGray: '#DDD'
      };

      let width, height;
      // Set up the basic data object
      let data = dataPaths.map(elem => ({name: elem.name, data: []}));

      let timeRange = [];

      let highlightedFlightId = null;

      // Fetch the data from csv and convert to D3 appropriate json
      onMount(async function () {
        $$invalidate('data', data = await Promise.all(dataPaths.map(entry => {
          return {
            name: entry.name,
            data: csv$1(entry.path, entry.callback)
          };
        })));
      });

    	function onwindowresize() {
    		width = window.innerWidth; $$invalidate('width', width);
    		height = window.innerHeight; $$invalidate('height', height);
    	}

    	function flightclick_handler(e) {
    		const $$result = highlightedFlightId = e.detail;
    		$$invalidate('highlightedFlightId', highlightedFlightId);
    		return $$result;
    	}

    	function func_2(elem) {
    		return elem.flightIdUnique === highlightedFlightId;
    	}

    	function timerangeselected_handler(e) {
    		const $$result = timeRange = e.detail;
    		$$invalidate('timeRange', timeRange);
    		return $$result;
    	}

    	return {
    		colors,
    		width,
    		height,
    		data,
    		timeRange,
    		highlightedFlightId,
    		onwindowresize,
    		flightclick_handler,
    		func_2,
    		timerangeselected_handler
    	};
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, []);
    	}
    }

    const app = new App({
    	target: document.body
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map

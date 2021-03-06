'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var jsonForm = require('@aquarelle/json-form');

class HiddenParser extends jsonForm.ControlParser
{
    getDefault(definition)
    {
        return definition.hasOwnProperty('default') ? definition.default : (definition.nullable ? null : undefined);
    }

    parse(definition, form, validator)
    {
        const data = super.parse(definition, form, validator);
        jsonForm.ControlParser.setConfigUsingValidation(data.config, definition.validation, ['required']);
        return data;
    }
}

class SwitchGroupParser extends jsonForm.ObjectControlParser
{
    getDefault(definition, form)
    {
        return definition.default && typeof definition.default === 'object' ? {...definition.default} : null;
    }

    getItems(definition) {
        if (!definition.items || !Array.isArray(definition.items)) {
            return [];
        }
        return definition.items;
    }

    getSubValidationProperty()
    {
        return 'validations';
    }
}

class TabsParser extends jsonForm.ControlParser
{
    getDefault(definition, form)
    {
        let def = {};
        if (Array.isArray(definition.items)) {
            definition.items.map(item => {
                if (item.name) {
                    def[item.name] = {};
                }
            });
        }
        return def;
    }

    getItems(definition, form, data, validator)
    {
        if (!Array.isArray(definition.items)) {
            return [];
        }

        const validation = data.name == null ? validator : data.validation;

        const items = definition.items.map(item => {
            item = {...item};

            let v = null;
            if (item.name) {
                if (!validation.hasOwnProperty(item.name)) {
                    validation[item.name] = {};
                }
                v = validation[item.name];
            }
            else {
                v = validation;
            }

            if (Array.isArray(item.items)) {
                item.items = form.parseControlList(item.items, v);
            }
            else {
                item.items = [];
            }

            return item;
        });

        return items;
    }
}

class SelectParser extends jsonForm.ControlParser
{

    constructor(element, group)
    {
        super(element);
        this._group = group;
    }

    getDefault(definition)
    {
        if (definition.config && definition.config.multiple) {
            return Array.isArray(definition.default) ? definition.default : [];
        }
        return definition.default == null ? (definition.nullable ? null : undefined) : definition.default;
    }

    getConfig(definition)
    {
        return {
            titleProp: 'title',
            groupTitleProp: 'title',
            valueProp: 'value',
            iconProp: 'icon',
            descriptionProp: 'description',
            itemsProp: 'items',
            multiple: false,
            ...definition.config,
            group: this._group
        };
    }

    getItems(definition, form, data, validator)
    {
        if (!definition.items || !Array.isArray(definition.items)) {
            return [];
        }

        if (!data.config.group) {
            return definition.items;
        }

        const itemsProp = data.config.itemsProp;
        const titleProp = data.config.titleProp;
        const groupTitleProp = data.config.groupTitleProp;

        const items = [];
        let first = true;
        definition.items.map(group => {
            if (!group[itemsProp] || !Array.isArray(group[itemsProp]) || group[itemsProp].length === 0) {
                return;
            }
            if (first) {
                first = false;
            }
            else {
                items.push({divider: true});
            }
            items.push({header: group[groupTitleProp]});
            group[itemsProp].map(item => {
                if (!item[titleProp]) {
                    item[titleProp] = '';
                }
                items.push(item);
            });
        });
        return items;
    }

    parse(definition, form, validator)
    {
        const data = super.parse(definition, form, validator);
        if (data.config.multiple) {
            jsonForm.ControlParser.setConfigUsingValidation(data.config, definition.validation, ['required', 'minItems', 'maxItems']);
        }
        else {
            jsonForm.ControlParser.setConfigUsingValidation(data.config, definition.validation, ['required']);
        }
        return data;
    }
}

class DisplayParser extends SelectParser
{
    constructor(name)
    {
        super(name, false);
    }

    parse(definition, form, validator)
    {
        definition.items = [
            {
                title: 'Phone',
                description: 'Extra small device (xs)',
                icon: 'smartphone',
                value: 'xs',
            },
            {
                title: 'Tablet',
                description: 'Small device (sm)',
                icon: 'tablet',
                value: 'sm',
            },
            {
                title: 'Laptop',
                description: 'Medium device (md)',
                icon: 'laptop',
                value: 'md',
            },
            {
                title: 'Desktop',
                description: 'Large device (lg)',
                icon: 'desktop_windows',
                value: 'lg',
            },
            {
                title: 'TV',
                description: 'Extra large device (xl)',
                icon: 'tv',
                value: 'xl',
            }
        ];
        if (!definition.display) {
            definition.display = {};
        }
        definition.display.icons = true;
        definition.display.chips = true;
        if (!definition.config) {
            definition.config = {};
        }
        definition.config.itemTitle = 'title';
        definition.config.itemDescription = 'description';
        definition.config.itemValue = 'value';
        definition.config.itemIcon = 'icon';
        return super.parse(definition, form, validator);
    }
}

class DescriptionParser extends jsonForm.ControlParser
{
    getName()
    {
        return null;
    }

    getValidation()
    {
        return null;
    }

    getDefault(definition)
    {
        return undefined;
    }
}

class IconParser extends jsonForm.StringControlParser
{
    parse(definition, form, validator)
    {
        if (!definition.validation) {
            definition.validation = {};
        }
        if (!definition.validation.pattern) {
            definition.validation.pattern = {
                value: '^(|([a-zA-Z0-9\\-\\_]+\\:[a-zA-Z0-9\\-\\_]+))$',
                key: 'validation.icon',
                text: 'Invalid icon format'
            };
        }
        return super.parse(definition, form, validator);
    }
}

class ComponentParser extends jsonForm.ControlParser
{
    getSubValidationProperty(definition, form, data, validator)
    {
        if (!definition.config) {
            return null;
        }
        return definition.config.validatorProp || null;
    }
}

class ComboboxParser extends jsonForm.SelectionControlParser
{

    getDefault(definition)
    {
        if (definition.config && definition.config.multiple) {
            return Array.isArray(definition.default) ? definition.default : [];
        }
        return definition.default == null ? (definition.nullable ? null : undefined) : definition.default;
    }

    parse(definition, form, validator)
    {
        const data = super.parse(definition, form, validator);
        if (data.config.multiple) {
            jsonForm.SelectionControlParser.setConfigUsingValidation(data.config, definition.validation, ['required', 'minItems', 'maxItems']);
        }
        else {
            jsonForm.SelectionControlParser.setConfigUsingValidation(data.config, definition.validation, ['required']);
        }
        return data;
    }
}

class ChipsParser extends ComboboxParser
{
    parse(definition, form, validator)
    {
        if (!definition.display || typeof definition.display !== 'object') {
            definition.display = {};
        }
        if (!definition.config || typeof definition.config !== 'object') {
            definition.config = {};
        }

        definition.display.chips = true;
        definition.config.multiple = true;
        return super.parse(definition, form, validator);
    }
}

class RepeatParser extends jsonForm.ArrayControlParser
{
    getSubValidationProperty(definition, form, data, validator) {
        return 'validations';
    }

    getItems(definition, form, data, validator) {
        if (!Array.isArray(definition.items)) {
            return [];
        }

        return definition.items;
    }
}

class RepeatVariantsParser extends jsonForm.ArrayControlParser
{
    getSubValidationProperty(definition, form, data, validator)
    {
        return 'variantValidations';
    }

    getConfig(definition, form)
    {
        if (!definition.config.variantField) {
            definition.config.variantField = 'variant_name';
        }
        return definition.config;
    }

    getItems(definition, form)
    {
        if (!Array.isArray(definition.items)) {
            return [];
        }
        return definition.items.map(item => {
            item = {...item};
            if (!Array.isArray(item.items)) {
                item.items = [];
            }
            return item;
        });
    }
}

class GroupRepeatParser extends jsonForm.ControlParser
{
    getSubValidationProperty(definition, form, data, validator) {
        return 'validations';
    }

    getDefault(definition, form)
    {
        let def = null;
        if (typeof definition.default === 'object') {
            def = {...definition.default};
        }
        else {
            def = {};
        }
        if (Array.isArray(definition.config.regions)) {
            definition.config.regions.map(item => {
                if (!def.hasOwnProperty(item.name) || !Array.isArray(def[item.name])) {
                    def[item.name] = [];
                }
            });
        }
        return def;
    }

    getValidation(definition, form, data, validator)
    {
        const validation = super.getValidation(definition, form, data, validator);

        data.config.regions.map(region => {
            if (region.validation == null || typeof region.validation !== 'object') {
                region.validation = {};
            }

            region.config = {};

            jsonForm.ControlParser.setConfigUsingValidation(region.config, region.validation, ['required', 'minItems', 'maxItems']);
        });

        return validation;
    }

    getItems(definition, form, data, validator)
    {
        if (!definition.items || !Array.isArray(definition.items)) {
            return [];
        }
        return definition.items;
    }

    parse(definition, form, validator)
    {
        const data = super.parse(definition, form, validator);
        jsonForm.ControlParser.setConfigUsingValidation(data.config, definition.validation, ['required']);
        return data;
    }
}

class GroupRepeatVariantsParser extends jsonForm.ControlParser
{
    getSubValidationProperty(definition, form, data, validator)
    {
        return 'regionVariantValidations';
    }

    getDefault(definition, form)
    {
        let def = null;
        if (typeof definition.default === 'object') {
            def = {...definition.default};
        }
        else {
            def = {};
        }
        if (Array.isArray(definition.config.regions)) {
            definition.config.regions.map(item => {
                if (!def.hasOwnProperty(item.name) || !Array.isArray(def[item.name])) {
                    def[item.name] = [];
                }
            });
        }
        return def;
    }

    getConfig(definition, form)
    {
        if (!definition.config.variantField) {
            definition.config.variantField = 'variant_name';
        }
        return definition.config;
    }

    getValidation(definition, form, data, validator)
    {
        const validation = super.getValidation(definition, form, data, validator);

        data.config.regions.map(region => {
            if (region.validation == null || typeof region.validation !== 'object') {
                region.validation = {};
            }

            region.config = {};

            jsonForm.ControlParser.setConfigUsingValidation(region.config, region.validation, ['required', 'minItems', 'maxItems']);
        });

        return validation;
    }

    getItems(definition, form, data, validator)
    {
        if (!definition.items || !Array.isArray(definition.items)) {
            return [];
        }

        return definition.items.map(item => {
            item = {...item};
            if (!Array.isArray(item.items)) {
                item.items = [];
            }
            return item;
        });
    }

    parse(definition, form, validator)
    {
        const data = super.parse(definition, form, validator);
        jsonForm.ControlParser.setConfigUsingValidation(data.config, definition.validation, ['required']);
        return data;
    }
}

class VariantParser extends jsonForm.ControlParser
{
    getSubValidationProperty(definition, form, data, validator)
    {
        return 'currentVariantValidations';
    }

    getDefault(definition)
    {
        let f = definition.config && definition.config.variantField ? definition.config.variantField : 'variant_name';
        if (typeof definition.default === 'object') {
            return {[f]: null, ...definition.default};
        }
        return {
            [f]: null
        };
    }

    getConfig(definition, form)
    {
        if (!definition.config.variantField) {
            definition.config.variantField = 'variant_name';
        }
        return definition.config;
    }

    getValidation(definition, form, data, validator)
    {
        if (data.name == null) {
            validator[data.config.variantField] = super.getValidation(definition, form, data, validator);
            return {};
        }
        return {
            [data.config.variantField]: super.getValidation(definition, form, data, validator)
        };
    }

    getItems(definition, form)
    {
        if (!Array.isArray(definition.items)) {
            return [];
        }
        return definition.items.map(item => {
            item = {...item};
            if (!Array.isArray(item.items)) {
                item.items = [];
            }
            return item;
        });
    }

    parse(definition, form, validator)
    {
        const data = super.parse(definition, form, validator);
        jsonForm.ControlParser.setConfigUsingValidation(data.config, definition.validation, ['required']);
        return data;
    }
}

class CheckboxMultiParser extends jsonForm.SelectionControlParser
{
    parse(definition, form, validator)
    {
        const data = super.parse(definition, form, validator);
        jsonForm.SelectionControlParser.setConfigUsingValidation(data.config, definition.validation, ['minItems', 'maxItems']);
        return data;
    }
}

class RangeParser extends jsonForm.NumberControlParser
{
    getDefault(definition)
    {
        if (definition.hasOwnProperty('default')) {
            if (Array.isArray(definitions.default)) {
                return [Number(definition.default[0]), Number(definitions.default[1])];
            }
        }
        if (definition.nullable) {
            return null;
        }

        return [0, 100];
    }
}

//

var script = {
    mixins: [jsonForm.JsonFormElementMixin],
    data() {
        return {inputType: 'text'};
    }
};

function normalizeComponent(template, style, script, scopeId, isFunctionalTemplate, moduleIdentifier /* server only */, shadowMode, createInjector, createInjectorSSR, createInjectorShadow) {
    if (typeof shadowMode !== 'boolean') {
        createInjectorSSR = createInjector;
        createInjector = shadowMode;
        shadowMode = false;
    }
    // Vue.extend constructor export interop.
    const options = typeof script === 'function' ? script.options : script;
    // render functions
    if (template && template.render) {
        options.render = template.render;
        options.staticRenderFns = template.staticRenderFns;
        options._compiled = true;
        // functional template
        if (isFunctionalTemplate) {
            options.functional = true;
        }
    }
    // scopedId
    if (scopeId) {
        options._scopeId = scopeId;
    }
    let hook;
    if (moduleIdentifier) {
        // server build
        hook = function (context) {
            // 2.3 injection
            context =
                context || // cached call
                    (this.$vnode && this.$vnode.ssrContext) || // stateful
                    (this.parent && this.parent.$vnode && this.parent.$vnode.ssrContext); // functional
            // 2.2 with runInNewContext: true
            if (!context && typeof __VUE_SSR_CONTEXT__ !== 'undefined') {
                context = __VUE_SSR_CONTEXT__;
            }
            // inject component styles
            if (style) {
                style.call(this, createInjectorSSR(context));
            }
            // register component module identifier for async chunk inference
            if (context && context._registeredComponents) {
                context._registeredComponents.add(moduleIdentifier);
            }
        };
        // used by ssr in case component is cached and beforeCreate
        // never gets called
        options._ssrRegister = hook;
    }
    else if (style) {
        hook = shadowMode
            ? function () {
                style.call(this, createInjectorShadow(this.$root.$options.shadowRoot));
            }
            : function (context) {
                style.call(this, createInjector(context));
            };
    }
    if (hook) {
        if (options.functional) {
            // register for functional component in vue file
            const originalRender = options.render;
            options.render = function renderWithStyleInjection(h, context) {
                hook.call(context);
                return originalRender(h, context);
            };
        }
        else {
            // inject component registration as beforeCreate hook
            const existing = options.beforeCreate;
            options.beforeCreate = existing ? [].concat(existing, hook) : [hook];
        }
    }
    return script;
}

/* script */
const __vue_script__ = script;

/* template */
var __vue_render__ = function () {var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;return _c('v-text-field',{attrs:{"type":_vm.inputType,"error-messages":_vm.allErrors,"label":_vm.$intl.translate(_vm.display.title),"suffix":_vm.$intl.translate(_vm.display.suffix),"prefix":_vm.$intl.translate(_vm.display.prefix),"prepend-inner-icon":_vm.$controlIcon(_vm.display.prependIcon),"prepend-icon":_vm.$controlIcon(_vm.display.prependOuterIcon),"append-icon":_vm.$controlIcon(_vm.display.appendIcon),"append-outer-icon":_vm.$controlIcon(_vm.display.appendOuterIcon),"hint":_vm.$intl.translate(_vm.display.hint),"placeholder":_vm.$intl.translate(_vm.display.placeholder),"mask":_vm.display.mask,"color":_vm.display.color || undefined,"clearable":_vm.display.clearable,"box":_vm.display.appearance === 'box',"solo":_vm.display.appearance === 'solo',"solo-inverted":_vm.display.appearance === 'solo-inverted',"outline":_vm.display.appearance === 'outline',"flat":!!_vm.display.flat,"counter":_vm.display.counter ? _vm.config.maxLength || false : false,"required":_vm.config.required,"maxlength":_vm.config.maxLength},on:{"blur":function($event){return _vm.validate()}},model:{value:(_vm.model[_vm.name]),callback:function ($$v) {_vm.$set(_vm.model, _vm.name, $$v);},expression:"model[name]"}})};
var __vue_staticRenderFns__ = [];

  /* style */
  const __vue_inject_styles__ = undefined;
  /* scoped */
  const __vue_scope_id__ = undefined;
  /* module identifier */
  const __vue_module_identifier__ = undefined;
  /* functional template */
  const __vue_is_functional_template__ = false;
  /* style inject */
  
  /* style inject SSR */
  

  
  var TextControl = normalizeComponent(
    { render: __vue_render__, staticRenderFns: __vue_staticRenderFns__ },
    __vue_inject_styles__,
    __vue_script__,
    __vue_scope_id__,
    __vue_is_functional_template__,
    __vue_module_identifier__,
    undefined,
    undefined
  );

//

var script$1 = {
    mixins: [jsonForm.JsonFormElementMixin]
};

/* script */
const __vue_script__$1 = script$1;

/* template */
var __vue_render__$1 = function () {var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;return _c('v-textarea',{attrs:{"error-messages":_vm.allErrors,"label":_vm.$intl.translate(_vm.display.title),"hint":_vm.$intl.translate(_vm.display.hint),"placeholder":_vm.$intl.translate(_vm.display.placeholder),"rows":_vm.display.rows,"suffix":_vm.$intl.translate(_vm.display.suffix),"prefix":_vm.$intl.translate(_vm.display.prefix),"prepend-inner-icon":_vm.$controlIcon(_vm.display.prependIcon),"prepend-icon":_vm.$controlIcon(_vm.display.prependOuterIcon),"append-icon":_vm.$controlIcon(_vm.display.appendIcon),"append-outer-icon":_vm.$controlIcon(_vm.display.appendOuterIcon),"auto-grow":!!_vm.display.autoGrow,"clearable":_vm.display.clearable,"box":_vm.display.appearance === 'box',"solo":_vm.display.appearance === 'solo',"solo-inverted":_vm.display.appearance === 'solo-inverted',"outline":_vm.display.appearance === 'outline',"flat":!!_vm.display.flat,"color":_vm.display.color || undefined,"counter":_vm.display.counter ? _vm.config.maxLength || false : false,"required":_vm.config.required,"maxlength":_vm.config.maxLength},on:{"blur":function($event){return _vm.validate()}},model:{value:(_vm.model[_vm.name]),callback:function ($$v) {_vm.$set(_vm.model, _vm.name, $$v);},expression:"model[name]"}})};
var __vue_staticRenderFns__$1 = [];

  /* style */
  const __vue_inject_styles__$1 = undefined;
  /* scoped */
  const __vue_scope_id__$1 = undefined;
  /* module identifier */
  const __vue_module_identifier__$1 = undefined;
  /* functional template */
  const __vue_is_functional_template__$1 = false;
  /* style inject */
  
  /* style inject SSR */
  

  
  var TextareaControl = normalizeComponent(
    { render: __vue_render__$1, staticRenderFns: __vue_staticRenderFns__$1 },
    __vue_inject_styles__$1,
    __vue_script__$1,
    __vue_scope_id__$1,
    __vue_is_functional_template__$1,
    __vue_module_identifier__$1,
    undefined,
    undefined
  );

var EmailControl = {
    extends: TextControl,
    created()
    {
        this.inputType = 'email';
    }
};

var TelControl = {
    extends: TextControl,
    created()
    {
        this.inputType = 'tel';
    }
};

//
var script$2 = {
    mixins: [jsonForm.JsonFormElementMixin],
    methods: {
        formatValue(val)
        {
            this.$set(this.model, this.name, Number(val));
        }
    }
};

/* script */
const __vue_script__$2 = script$2;

/* template */
var __vue_render__$2 = function () {var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;return _c('v-text-field',{attrs:{"type":"number","error-messages":_vm.allErrors,"label":_vm.$intl.translate(_vm.display.title),"suffix":_vm.$intl.translate(_vm.display.suffix),"prefix":_vm.$intl.translate(_vm.display.prefix),"prepend-inner-icon":_vm.$controlIcon(_vm.display.prependIcon),"prepend-icon":_vm.$controlIcon(_vm.display.prependOuterIcon),"append-icon":_vm.$controlIcon(_vm.display.appendIcon),"append-outer-icon":_vm.$controlIcon(_vm.display.appendOuterIcon),"hint":_vm.$intl.translate(_vm.display.hint),"placeholder":_vm.$intl.translate(_vm.display.placeholder),"mask":_vm.display.mask,"clearable":_vm.display.clearable,"box":_vm.display.appearance === 'box',"solo":_vm.display.appearance === 'solo',"solo-inverted":_vm.display.appearance === 'solo-inverted',"outline":_vm.display.appearance === 'outline',"flat":!!_vm.display.flat,"color":_vm.display.color || undefined,"counter":_vm.display.counter ? _vm.config.maxLength || false : false,"required":_vm.config.required,"maxlength":_vm.config.maxLength,"step":_vm.config.multipleOf || 1,"min":_vm.config.minimum,"max":_vm.config.maximum},on:{"input":function($event){return _vm.formatValue($event)},"blur":function($event){return _vm.validate()}},model:{value:(_vm.model[_vm.name]),callback:function ($$v) {_vm.$set(_vm.model, _vm.name, $$v);},expression:"model[name]"}})};
var __vue_staticRenderFns__$2 = [];

  /* style */
  const __vue_inject_styles__$2 = undefined;
  /* scoped */
  const __vue_scope_id__$2 = undefined;
  /* module identifier */
  const __vue_module_identifier__$2 = undefined;
  /* functional template */
  const __vue_is_functional_template__$2 = false;
  /* style inject */
  
  /* style inject SSR */
  

  
  var NumberControl = normalizeComponent(
    { render: __vue_render__$2, staticRenderFns: __vue_staticRenderFns__$2 },
    __vue_inject_styles__$2,
    __vue_script__$2,
    __vue_scope_id__$2,
    __vue_is_functional_template__$2,
    __vue_module_identifier__$2,
    undefined,
    undefined
  );

//

var script$3 = {
    mixins: [jsonForm.JsonFormElementMixin],
    data()
    {
        return {visible: false};
    },
    methods: {
        toggle()
        {
            this.visible = !this.visible;
        }
    }
};

/* script */
const __vue_script__$3 = script$3;

/* template */
var __vue_render__$3 = function () {var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;return _c('v-text-field',{attrs:{"type":_vm.visible ? 'text' : 'password',"error-messages":_vm.allErrors,"label":_vm.$intl.translate(_vm.display.title),"suffix":_vm.$intl.translate(_vm.display.suffix),"prefix":_vm.$intl.translate(_vm.display.prefix),"prepend-inner-icon":_vm.$controlIcon(_vm.display.prependIcon),"prepend-icon":_vm.$controlIcon(_vm.display.prependOuterIcon),"append-outer-icon":_vm.$controlIcon(_vm.display.appendOuterIcon),"append-icon":_vm.visible ? 'visibility_off' : 'visibility',"hint":_vm.$intl.translate(_vm.display.hint),"placeholder":_vm.$intl.translate(_vm.display.placeholder),"clearable":_vm.display.clearable,"box":_vm.display.appearance === 'box',"solo":_vm.display.appearance === 'solo',"solo-inverted":_vm.display.appearance === 'solo-inverted',"outline":_vm.display.appearance === 'outline',"color":_vm.display.color || undefined,"flat":!!_vm.display.flat,"counter":_vm.display.counter ? _vm.config.maxLength || false : false,"required":_vm.config.required,"maxlength":_vm.config.maxLength},on:{"click:append":_vm.toggle,"blur":function($event){return _vm.validate()}},model:{value:(_vm.model[_vm.name]),callback:function ($$v) {_vm.$set(_vm.model, _vm.name, $$v);},expression:"model[name]"}})};
var __vue_staticRenderFns__$3 = [];

  /* style */
  const __vue_inject_styles__$3 = undefined;
  /* scoped */
  const __vue_scope_id__$3 = undefined;
  /* module identifier */
  const __vue_module_identifier__$3 = undefined;
  /* functional template */
  const __vue_is_functional_template__$3 = false;
  /* style inject */
  
  /* style inject SSR */
  

  
  var PasswordControl = normalizeComponent(
    { render: __vue_render__$3, staticRenderFns: __vue_staticRenderFns__$3 },
    __vue_inject_styles__$3,
    __vue_script__$3,
    __vue_scope_id__$3,
    __vue_is_functional_template__$3,
    __vue_module_identifier__$3,
    undefined,
    undefined
  );

var UrlControl = {
    extends: TextControl,
    created()
    {
        this.inputType = 'url';
    }
};

var ColorControl = {
    extends: TextControl,
    created()
    {
        this.display.placeholder = '#000000';
        this.config.maxLength = 7;
        this.inputType = 'color';
    }
};

//

var script$4 = {
    mixins: [jsonForm.JsonFormElementMixin]
};

/* script */
const __vue_script__$4 = script$4;

/* template */
var __vue_render__$4 = function () {var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;return _c('v-text-field',{attrs:{"type":"text","error-messages":_vm.allErrors,"label":_vm.$intl.translate(_vm.display.title),"suffix":_vm.$intl.translate(_vm.display.suffix),"prefix":_vm.$intl.translate(_vm.display.prefix),"append-icon":_vm.$controlIcon(_vm.model[_vm.name] || ''),"prepend-inner-icon":_vm.$controlIcon(_vm.display.prependIcon),"prepend-icon":_vm.$controlIcon(_vm.display.prependOuterIcon),"append-outer-icon":_vm.$controlIcon(_vm.display.appendOuterIcon),"hint":_vm.$intl.translate(_vm.display.hint),"placeholder":_vm.$intl.translate(_vm.display.placeholder),"box":_vm.display.appearance === 'box',"solo":_vm.display.appearance === 'solo',"solo-inverted":_vm.display.appearance === 'solo-inverted',"outline":_vm.display.appearance === 'outline',"flat":!!_vm.display.flat,"color":_vm.display.color || undefined,"counter":_vm.display.counter ? _vm.config.maxLength || false : false,"required":_vm.config.required,"maxlength":_vm.config.maxLength},on:{"blur":function($event){return _vm.validate()}},model:{value:(_vm.model[_vm.name]),callback:function ($$v) {_vm.$set(_vm.model, _vm.name, $$v);},expression:"model[name]"}})};
var __vue_staticRenderFns__$4 = [];

  /* style */
  const __vue_inject_styles__$4 = undefined;
  /* scoped */
  const __vue_scope_id__$4 = undefined;
  /* module identifier */
  const __vue_module_identifier__$4 = undefined;
  /* functional template */
  const __vue_is_functional_template__$4 = false;
  /* style inject */
  
  /* style inject SSR */
  

  
  var IconControl = normalizeComponent(
    { render: __vue_render__$4, staticRenderFns: __vue_staticRenderFns__$4 },
    __vue_inject_styles__$4,
    __vue_script__$4,
    __vue_scope_id__$4,
    __vue_is_functional_template__$4,
    __vue_module_identifier__$4,
    undefined,
    undefined
  );

var HiddenControl = {
    mixins: [jsonForm.JsonFormElementMixin],
    render() {
        return null;
    }
};

var UUIDControl = {
    mixins: [jsonForm.JsonFormElementMixin],
    render()
    {
        return null;
    },
    created()
    {
        if (this.name !== null && typeof this.model[this.name] !== 'string') {
            const id = this.$uuid(typeof this.config.separator === 'string' ? this.config.separator : '-');
            this.$set(this.model, this.name, id);
        }
    }
};

//

var script$5 = {
    name: 'slider-control',
    mixins: [jsonForm.JsonFormElementMixin],
    methods: {
        formatValue(val)
        {
            this.$set(this.model, this.name, Number(val));
        },
        getTickLabel(value)
        {
            if ((this.config.multipleOf || 1) !== 1) {
                return value;
            }

            const index = value - (this.config.minimum || 0);
            if (this.display.labels && this.display.labels[index] != null) {
                return this.display.labels[index];
            }
            return value;
        }
    }
};

/* script */
const __vue_script__$5 = script$5;

/* template */
var __vue_render__$5 = function () {var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;return _c('v-slider',{attrs:{"error-messages":_vm.allErrors,"label":_vm.$intl.translate(_vm.display.title),"color":_vm.display.color || undefined,"thumb-color":_vm.display.thumbColor || undefined,"track-color":_vm.display.trackColor || undefined,"prepend-icon":_vm.$controlIcon(_vm.display.prependIcon),"append-icon":_vm.$controlIcon(_vm.display.appendIcon),"hint":_vm.$intl.translate(_vm.display.hint),"persistent-hint":"","ticks":"","tick-labels":_vm.display.labels || undefined,"thumb-label":"","required":_vm.config.required,"step":_vm.config.multipleOf || 1,"min":_vm.config.minimum || 0,"max":_vm.config.maximum || 100},on:{"input":function($event){return _vm.formatValue($event)},"blur":function($event){return _vm.validate()}},scopedSlots:_vm._u([{key:"thumb-label",fn:function(props){return [_c('span',[_vm._v(_vm._s(_vm.getTickLabel(props.value)))])]}}]),model:{value:(_vm.model[_vm.name]),callback:function ($$v) {_vm.$set(_vm.model, _vm.name, $$v);},expression:"model[name]"}})};
var __vue_staticRenderFns__$5 = [];

  /* style */
  const __vue_inject_styles__$5 = undefined;
  /* scoped */
  const __vue_scope_id__$5 = undefined;
  /* module identifier */
  const __vue_module_identifier__$5 = undefined;
  /* functional template */
  const __vue_is_functional_template__$5 = false;
  /* style inject */
  
  /* style inject SSR */
  

  
  var SliderControl = normalizeComponent(
    { render: __vue_render__$5, staticRenderFns: __vue_staticRenderFns__$5 },
    __vue_inject_styles__$5,
    __vue_script__$5,
    __vue_scope_id__$5,
    __vue_is_functional_template__$5,
    __vue_module_identifier__$5,
    undefined,
    undefined
  );

//

var script$6 = {
    name: 'range-control',
    mixins: [jsonForm.JsonFormElementMixin],
    created()
    {
        const p = this.modelProxy;
        if (p) {
            if (p[0] < (this.config.minimum || 0)) {
                p[0] = this.config.minimum || 0;
            }
            if (p[1] > (this.config.maximum == null ? 100 : this.config.maximum)) {
                p[1] = this.config.maximum == null ? 100 : this.config.maximum;
            }
        }
    },
    methods: {
        formatValue(val)
        {
            this.$set(this.model, this.name, [Number(val[0]), Number(val[1])]);
        },
        getTickLabel(value)
        {
            if ((this.config.multipleOf || 1) !== 1) {
                return value;
            }

            const index = value - (this.config.minimum || 0);
            if (this.display.labels && this.display.labels[index] != null) {
                return this.display.labels[index];
            }
            return value;
        }
    }
};

/* script */
const __vue_script__$6 = script$6;

/* template */
var __vue_render__$6 = function () {var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;return _c('v-range-slider',{attrs:{"error-messages":_vm.allErrors,"label":_vm.$intl.translate(_vm.display.title),"color":_vm.display.color || undefined,"thumb-color":_vm.display.thumbColor || undefined,"track-color":_vm.display.trackColor || undefined,"prepend-icon":_vm.$controlIcon(_vm.display.prependIcon),"append-icon":_vm.$controlIcon(_vm.display.appendIcon),"hint":_vm.$intl.translate(_vm.display.hint),"persistent-hint":"","ticks":"","tick-labels":_vm.display.labels || undefined,"thumb-label":"","required":_vm.config.required,"step":_vm.config.multipleOf || 1,"min":_vm.config.minimum || 0,"max":_vm.config.maximum || 100},on:{"input":function($event){return _vm.formatValue($event)},"blur":function($event){return _vm.validate()}},scopedSlots:_vm._u([{key:"thumb-label",fn:function(props){return [_c('span',[_vm._v(_vm._s(_vm.getTickLabel(props.value)))])]}}]),model:{value:(_vm.model[_vm.name]),callback:function ($$v) {_vm.$set(_vm.model, _vm.name, $$v);},expression:"model[name]"}})};
var __vue_staticRenderFns__$6 = [];

  /* style */
  const __vue_inject_styles__$6 = undefined;
  /* scoped */
  const __vue_scope_id__$6 = undefined;
  /* module identifier */
  const __vue_module_identifier__$6 = undefined;
  /* functional template */
  const __vue_is_functional_template__$6 = false;
  /* style inject */
  
  /* style inject SSR */
  

  
  var RangeControl = normalizeComponent(
    { render: __vue_render__$6, staticRenderFns: __vue_staticRenderFns__$6 },
    __vue_inject_styles__$6,
    __vue_script__$6,
    __vue_scope_id__$6,
    __vue_is_functional_template__$6,
    __vue_module_identifier__$6,
    undefined,
    undefined
  );

//

var script$7 = {
    mixins: [jsonForm.JsonFormElementMixin],
    data() {
        return {info: ''};
    },
    computed: {
        accept()
        {
            if (!this.config.fileMimeType) {
                return undefined;
            }
            if (typeof this.config.fileMimeType === 'string') {
                return this.config.fileMimeType;
            }
            if (Array.isArray(this.config.fileMimeType)) {
                return this.config.fileMimeType.join(', ');
            }
            return undefined;
        },
        uploadInput()
        {
            return this.$refs.file;
        }
    },
    methods: {
        onClear(data)
        {
            if (data != null) {
                return;
            }
            this.$set(this.model, this.name, this.config.multiple ? [] : undefined);
            this.setInfo();
        },
        removeItem(item) {
            const pos = this.modelProxy.indexOf(item);
            if (pos === -1) {
                return;
            }
            this.modelProxy.splice(pos, 1);
            this.setInfo();
        },
        uploadInputChanged(input = this.uploadInput)
        {
            const files = input.files;
            if (!files || files.length === 0) {
                input.value = null;
                return;
            }
            if (this.config.multiple) {
                let list = [];
                for (let i = 0; i < files.length; i++) {
                    list.push(files[i]);
                }
                if (this.modelProxy && this.modelProxy.length > 0) {
                    list = this.modelProxy.concat(list);
                }
                this.$set(this.model, this.name, list);
            } else {
                this.$set(this.model, this.name, files[0]);
            }
            input.value = null;
            this.setInfo();
        },
        getFilesInfo(files) {
            if (files == null) {
                return '';
            }

            const size = this.totalSize(files);
            const formatted = this.formatSize(size);

            if (Array.isArray(files)) {
                if (files.length === 0) {
                    return '';
                }
                return this.$intl.translate({
                    key: 'common.form.multipleFilesLabel',
                    text: '{count} files ({formattedSize})'
                }, {
                    count: files.length,
                    size: size,
                    formattedSize: formatted
                });
            }

            return this.$intl.translate({
                key: 'common.form.filesLabel',
                text: '{name} ({formattedSize})'
            }, {
                name: files.name,
                size: size,
                formattedSize: formatted
            });
        },
        setInfo()
        {
            this.info = this.getFilesInfo(this.modelProxy);
            this.validate();
        },
        totalSize(files) {
            if (Array.isArray(files)) {
                return files.reduce((total, file) => total + (file.size || 0), 0)
            }
            return files.size || 0;
        },
        formatSize(value, precision = 2)
        {
            const sizes = ['B', 'KB', 'MB'];

            for (let i = 0; i < sizes.length; i++) {
                if (value < 1024) {
                    return value.toFixed(precision) + sizes[i];
                }
                value /= 1024;
            }

            return Math.ceil(value) + 'GB';
        }
    }
};

/* script */
const __vue_script__$7 = script$7;

/* template */
var __vue_render__$7 = function () {var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;return _c('div',[_c('v-text-field',{attrs:{"type":"text","error-messages":_vm.allErrors,"value":_vm.info,"readonly":"","label":_vm.$intl.translate(_vm.display.title),"hint":_vm.$intl.translate(_vm.display.hint),"persistent-hint":"","suffix":_vm.$intl.translate(_vm.display.suffix),"prefix":_vm.$intl.translate(_vm.display.prefix),"prepend-inner-icon":_vm.$controlIcon(_vm.display.prependIcon),"prepend-icon":_vm.$controlIcon(_vm.display.prependOuterIcon),"append-icon":_vm.$controlIcon(_vm.display.appendIcon),"append-outer-icon":_vm.$controlIcon(_vm.display.appendOuterIcon),"color":_vm.display.color || undefined,"clearable":_vm.display.clearable,"box":_vm.display.appearance === 'box',"solo":_vm.display.appearance === 'solo',"solo-inverted":_vm.display.appearance === 'solo-inverted',"outline":_vm.display.appearance === 'outline',"flat":!!_vm.display.flat,"required":_vm.config.required},on:{"input":function($event){return _vm.onClear($event)}},nativeOn:{"click":function($event){$event.stopPropagation();return _vm.uploadInput.click()}}}),_vm._v(" "),(_vm.config.multiple && _vm.modelProxy != null && _vm.modelProxy.length > 0)?_c('v-list',{attrs:{"dense":""}},_vm._l((_vm.modelProxy),function(file,key){return _c('v-list-tile',{key:key},[_c('v-list-tile-content',[_c('v-list-tile-title',[_vm._v(_vm._s(file.name))]),_vm._v(" "),_c('v-list-tile-sub-title',[_vm._v(_vm._s(_vm.formatSize(file.size)))])],1),_vm._v(" "),_c('v-list-tile-action',[_c('v-btn',{attrs:{"icon":"","ripple":""},on:{"click":function($event){$event.stopPropagation();return _vm.removeItem(file)}}},[_c('v-icon',{attrs:{"color":"red"}},[_vm._v("delete")])],1)],1)],1)}),1):_vm._e(),_vm._v(" "),_c('input',{directives:[{name:"show",rawName:"v-show",value:(false),expression:"false"}],ref:"file",attrs:{"type":"file","accept":_vm.accept,"multiple":!!_vm.config.multiple},on:{"change":function($event){return _vm.uploadInputChanged()}}})],1)};
var __vue_staticRenderFns__$7 = [];

  /* style */
  const __vue_inject_styles__$7 = undefined;
  /* scoped */
  const __vue_scope_id__$7 = undefined;
  /* module identifier */
  const __vue_module_identifier__$7 = undefined;
  /* functional template */
  const __vue_is_functional_template__$7 = false;
  /* style inject */
  
  /* style inject SSR */
  

  
  var FileControl = normalizeComponent(
    { render: __vue_render__$7, staticRenderFns: __vue_staticRenderFns__$7 },
    __vue_inject_styles__$7,
    __vue_script__$7,
    __vue_scope_id__$7,
    __vue_is_functional_template__$7,
    __vue_module_identifier__$7,
    undefined,
    undefined
  );

//

var script$8 = {
    mixins: [jsonForm.JsonFormElementMixin]
};

/* script */
const __vue_script__$8 = script$8;

/* template */
var __vue_render__$8 = function () {var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;return _c('v-checkbox',{staticClass:"mt-0",attrs:{"error-messages":_vm.allErrors,"color":_vm.display.color || undefined,"label":_vm.$intl.translate(_vm.display.title),"prepend-icon":_vm.$controlIcon(_vm.display.prependIcon),"append-icon":_vm.$controlIcon(_vm.display.appendIcon),"hint":_vm.$intl.translate(_vm.display.hint),"persistent-hint":"","false-value":false,"true-value":true,"required":_vm.config.required},on:{"blur":function($event){return _vm.validate()}},model:{value:(_vm.model[_vm.name]),callback:function ($$v) {_vm.$set(_vm.model, _vm.name, $$v);},expression:"model[name]"}})};
var __vue_staticRenderFns__$8 = [];

  /* style */
  const __vue_inject_styles__$8 = undefined;
  /* scoped */
  const __vue_scope_id__$8 = undefined;
  /* module identifier */
  const __vue_module_identifier__$8 = undefined;
  /* functional template */
  const __vue_is_functional_template__$8 = false;
  /* style inject */
  
  /* style inject SSR */
  

  
  var CheckboxControl = normalizeComponent(
    { render: __vue_render__$8, staticRenderFns: __vue_staticRenderFns__$8 },
    __vue_inject_styles__$8,
    __vue_script__$8,
    __vue_scope_id__$8,
    __vue_is_functional_template__$8,
    __vue_module_identifier__$8,
    undefined,
    undefined
  );

//
//
//

var script$9 = {
    name: 'control-label',
    props: {
        text: {type: String, required: false, default: null},
        hasError: {type: Boolean, required: false, default: false},
        required: {type: Boolean, required: false, default: false},
    }
};

/* script */
const __vue_script__$9 = script$9;

/* template */
var __vue_render__$9 = function () {var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;return _c('label',{directives:[{name:"show",rawName:"v-show",value:(_vm.text != null && _vm.text !== ''),expression:"text != null && text !== ''"}],class:_vm.$mergeClasses({'v-label': true, 'error--text': _vm.hasError}, _vm.$attrs.class)},[_vm._v(_vm._s(_vm.text)),_c('sup',{directives:[{name:"show",rawName:"v-show",value:(_vm.required),expression:"required"}],staticStyle:{"user-select":"none"}},[_vm._v("*")])])};
var __vue_staticRenderFns__$9 = [];

  /* style */
  const __vue_inject_styles__$9 = undefined;
  /* scoped */
  const __vue_scope_id__$9 = undefined;
  /* module identifier */
  const __vue_module_identifier__$9 = undefined;
  /* functional template */
  const __vue_is_functional_template__$9 = false;
  /* style inject */
  
  /* style inject SSR */
  

  
  var ControlLabel = normalizeComponent(
    { render: __vue_render__$9, staticRenderFns: __vue_staticRenderFns__$9 },
    __vue_inject_styles__$9,
    __vue_script__$9,
    __vue_scope_id__$9,
    __vue_is_functional_template__$9,
    __vue_module_identifier__$9,
    undefined,
    undefined
  );

//
//
//

var script$a = {
    name: 'control-icon',
    computed: {
        icon()
        {
            const d = this.$slots.default;
            if (!d || !d[0]) {
                return undefined;
            }
            return this.$controlIcon(d[0].text);
        }
    }
};

/* script */
const __vue_script__$a = script$a;

/* template */
var __vue_render__$a = function () {var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;return _c('v-icon',_vm._b({domProps:{"textContent":_vm._s(_vm.icon)}},'v-icon',_vm.$attrs,false))};
var __vue_staticRenderFns__$a = [];

  /* style */
  const __vue_inject_styles__$a = undefined;
  /* scoped */
  const __vue_scope_id__$a = undefined;
  /* module identifier */
  const __vue_module_identifier__$a = undefined;
  /* functional template */
  const __vue_is_functional_template__$a = false;
  /* style inject */
  
  /* style inject SSR */
  

  
  var ControlIcon = normalizeComponent(
    { render: __vue_render__$a, staticRenderFns: __vue_staticRenderFns__$a },
    __vue_inject_styles__$a,
    __vue_script__$a,
    __vue_scope_id__$a,
    __vue_is_functional_template__$a,
    __vue_module_identifier__$a,
    undefined,
    undefined
  );

//
//
//
//
//
//
//

var script$b = {
    name: 'block-error',
    props: {
        error: {type: String, default: null, required: false}
    }
};

/* script */
const __vue_script__$b = script$b;

/* template */
var __vue_render__$b = function () {var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;return _c('div',_vm._b({directives:[{name:"show",rawName:"v-show",value:(_vm.error !== null),expression:"error !== null"}],staticClass:"v-messages error--text"},'div',_vm.$attrs,false),[_c('div',{staticClass:"v-messages__message"},[_vm._v("\n        "+_vm._s(_vm.error)+"\n    ")])])};
var __vue_staticRenderFns__$b = [];

  /* style */
  const __vue_inject_styles__$b = undefined;
  /* scoped */
  const __vue_scope_id__$b = undefined;
  /* module identifier */
  const __vue_module_identifier__$b = undefined;
  /* functional template */
  const __vue_is_functional_template__$b = false;
  /* style inject */
  
  /* style inject SSR */
  

  
  var BlockError = normalizeComponent(
    { render: __vue_render__$b, staticRenderFns: __vue_staticRenderFns__$b },
    __vue_inject_styles__$b,
    __vue_script__$b,
    __vue_scope_id__$b,
    __vue_is_functional_template__$b,
    __vue_module_identifier__$b,
    undefined,
    undefined
  );

//
//
//
//
//
//
//

var script$c = {
    name: 'list-error',
    props: {
        error: {type: String, default: null, required: false}
    }
};

/* script */
const __vue_script__$c = script$c;

/* template */
var __vue_render__$c = function () {var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;return _c('div',_vm._b({directives:[{name:"show",rawName:"v-show",value:(_vm.error !== null),expression:"error !== null"}],staticClass:"v-messages mt-1 error--text"},'div',_vm.$attrs,false),[_c('div',{staticClass:"v-messages__message"},[_vm._v("\n        "+_vm._s(_vm.error)+"\n    ")])])};
var __vue_staticRenderFns__$c = [];

  /* style */
  const __vue_inject_styles__$c = undefined;
  /* scoped */
  const __vue_scope_id__$c = undefined;
  /* module identifier */
  const __vue_module_identifier__$c = undefined;
  /* functional template */
  const __vue_is_functional_template__$c = false;
  /* style inject */
  
  /* style inject SSR */
  

  
  var ListError = normalizeComponent(
    { render: __vue_render__$c, staticRenderFns: __vue_staticRenderFns__$c },
    __vue_inject_styles__$c,
    __vue_script__$c,
    __vue_scope_id__$c,
    __vue_is_functional_template__$c,
    __vue_module_identifier__$c,
    undefined,
    undefined
  );

//

var script$d = {
    name: 'dialog-forms',
    components: {JsonFormGroup: jsonForm.JsonFormGroup},
    mixins: [jsonForm.ValidationMixin, jsonForm.JsonFormParserMixin],
    props: {
        path: {type: Array, default: () => []},
        options: {type: Object, default: () => ({})},
        hideTimeout: {type: Number, default: 200}
    },
    data()
    {
        return {
            lastOverflow: 'auto',
            height: 0,
            actionsEnabled: true,
            me: this,
            currentDialogIndex: -1,
            currentMethodPrefix: 'slide',
            currentMethod: 'push',
            dialogs: [],
            modalShow: false
        };
    },
    watch: {
        currentDialogIndex(val, old)
        {
            this.$nextTick(() => {
                if (old === -1) {
                    const el = document.documentElement;
                    this.lastOverflow = el.style.overflowY || 'auto';
                    el.style.overflowY = 'hidden';
                    this.setHeight();
                } else if (val === -1) {
                    document.documentElement.style.overflowY = this.lastOverflow;
                }
                this.modalShow = val >= 0;
                if (!this.modalShow) {
                    this.clearForms();
                }
            });
        },
        '$vuetify.breakpoint.height'()
        {
            this.setHeight();
        },
        '$vuetify.breakpoint.width'()
        {
            this.setHeight();
        }
    },
    computed: {
        currentDialog()
        {
            if (this.currentDialogIndex < 0) {
                return null;
            }
            return this.dialogs[this.currentDialogIndex] || null;
        },
        currentTitle()
        {
            const dialog = this.currentDialog;
            if (dialog == null) {
                return undefined;
            }
            return this.$intl.translate(dialog.title, dialog.model);
        }
    },
    validations()
    {
        const v = {};
        this.dialogs.map((dialog, index) => {
            const m = {model: dialog.validator};
            v[index + ''] = dialog.name ? {[dialog.name]: m} : m;
        });
        return {dialogs: v};
    },
    methods: {
        setHeight()
        {
            const toolbar = this.$refs.toolbar;
            const th = toolbar ? toolbar.computedHeight : 0;
            this.height = this.$vuetify.breakpoint.height - th;
        },
        clearForms()
        {
            this.dialogs.splice(0, this.dialogs.length);
        },
        pushUnparsedForm(form, model)
        {
            form = {...form};
            form.validator = {};
            form.items = this.parser.parseControlList(form.items || [], form.validator);
            if (model !== undefined) {
                form.model = model;
            }
            this.pushForm(form);
        },
        pushForm(options)
        {
            if (!this.actionsEnabled) {
                return;
            }
            const dialog = {
                form: options.items || [],
                validator: options.validator || {},

                name: options.name || undefined,
                model: options.model || {},

                actions: options.actions || {},

                title: options.title || null,
                button: options.button || null,
                cancelButton: options.cancelButton || null,

                path: options.path || []
            };
            this.dialogs.push(dialog);
            this.currentMethod = 'push';
            this.currentDialogIndex++;
        },
        popForm()
        {
            if (this.currentDialogIndex < 0) {
                return;
            }

            if (this.currentDialogIndex === 0 && this.hideTimeout > 0) {
                this.modalShow = false;
                setTimeout(() => {
                    this.currentMethod = 'pop';
                    this.currentDialogIndex--;
                }, this.hideTimeout);
                return;
            }

            this.currentMethod = 'pop';
            this.currentDialogIndex--;
        },
        beforeEnter()
        {
            this.actionsEnabled = false;
        },
        afterLeave()
        {
            const last = this.dialogs.length - 1;
            if (last > this.currentDialogIndex) {
                this.dialogs.pop();
            }
            this.actionsEnabled = true;
        },
        onCancel(dialog)
        {
            if (typeof dialog.actions.cancel === 'function') {
                if (dialog.actions.cancel(dialog.model) === false) {
                    // Prevent cancel
                    return false;
                }
            }
            this.popForm();
            return true;
        },
        onSubmit(dialog)
        {
            const index = this.dialogs.indexOf(dialog);
            if (index < 0) {
                return false;
            }
            const v = this.$v.dialogs[index].model;
            v.$touch();
            if (v.$invalid || v.$pending) {
                return false;
            }
            if (typeof dialog.actions.submit === 'function') {
                if (dialog.actions.submit(dialog.model, this.$clone(dialog.model)) === true) {
                    this.popForm();
                }
            }
            else {
                this.popForm();
            }
            return true;
        },
        onRouteLeave(func)
        {
            const length = this.dialogs.length;
            if (length === 0) {
                return true;
            }
            if (!func(this.$refs.formGroup[length - 1])) {
                return false;
            }
            this.onCancel(this.dialogs[length - 1]);
            return false;
        }
    }
};

/* script */
const __vue_script__$d = script$d;
/* template */
var __vue_render__$d = function () {var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;return _c('v-dialog',{attrs:{"overlay":false,"persistent":"","lazy":"","scrollable":"","fullscreen":"","transition":"dialog-bottom-transition"},model:{value:(_vm.modalShow),callback:function ($$v) {_vm.modalShow=$$v;},expression:"modalShow"}},[(_vm.currentDialog != null)?_c('v-card',[_c('v-toolbar',{ref:"toolbar",staticStyle:{"flex":"0 0 auto"},attrs:{"color":"secondary","dark":""}},[_c('v-btn',{attrs:{"icon":"","dark":""},nativeOn:{"click":function($event){_vm.actionsEnabled && _vm.onCancel(_vm.currentDialog);}}},[_c('v-icon',[_vm._v(_vm._s(_vm.currentDialogIndex === 0 ? 'close' : 'arrow_back'))])],1),_vm._v(" "),_c('v-toolbar-title',[_vm._v(_vm._s(_vm.currentTitle))]),_vm._v(" "),_c('v-spacer'),_vm._v(" "),_c('v-toolbar-items',[_c('v-btn',{attrs:{"dark":"","flat":"","disabled":_vm.$v.dialogs[_vm.currentDialogIndex].$pending,"loading":_vm.$v.dialogs[_vm.currentDialogIndex].$pending},nativeOn:{"click":function($event){_vm.actionsEnabled && _vm.onSubmit(_vm.currentDialog);}}},[_vm._v("\n                    "+_vm._s(_vm.$intl.translate(_vm.currentDialog.button, _vm.currentDialog.model))+"\n                    "),_c('v-icon',[_vm._v("check")])],1)],1)],1),_vm._v(" "),_c('v-card-text',{staticClass:"dialog-slider-wrapper",style:({height: _vm.height + 'px'})},[_c('transition-group',{staticClass:"dialog-slider",attrs:{"name":_vm.currentMethodPrefix + '-' + _vm.currentMethod,"tag":"div"},on:{"before-enter":function($event){return _vm.beforeEnter()},"after-leave":function($event){return _vm.afterLeave()}}},_vm._l((_vm.dialogs),function(dialog,index){return _c('div',{directives:[{name:"show",rawName:"v-show",value:(_vm.currentDialogIndex === index),expression:"currentDialogIndex === index"}],key:_vm.$uniqueObjectId(dialog, index),staticClass:"dialog-slide"},[_c('v-form',{attrs:{"novalidate":""},on:{"submit":function($event){$event.preventDefault();_vm.actionsEnabled && _vm.onSubmit(dialog);}}},[_c('json-form-group',{ref:"formGroup",refInFor:true,attrs:{"items":dialog.form,"model":dialog.model,"validator":_vm.$v.dialogs[index].model,"name":dialog.name,"path":dialog.path,"wrapper":_vm.me,"validations-container":dialog.validator,"parent-validations-container":dialog.validator}}),_vm._v(" "),_c('input',{directives:[{name:"show",rawName:"v-show",value:(false),expression:"false"}],attrs:{"type":"submit"}})],1)],1)}),0)],1)],1):_vm._e()],1)};
var __vue_staticRenderFns__$d = [];

  /* style */
  const __vue_inject_styles__$d = undefined;
  /* scoped */
  const __vue_scope_id__$d = undefined;
  /* module identifier */
  const __vue_module_identifier__$d = undefined;
  /* functional template */
  const __vue_is_functional_template__$d = false;
  /* style inject */
  
  /* style inject SSR */
  

  
  var DialogForms = normalizeComponent(
    { render: __vue_render__$d, staticRenderFns: __vue_staticRenderFns__$d },
    __vue_inject_styles__$d,
    __vue_script__$d,
    __vue_scope_id__$d,
    __vue_is_functional_template__$d,
    __vue_module_identifier__$d,
    undefined,
    undefined
  );

//

var script$e = {
    name: 'block-form',
    components: {DialogForms},
    mixins: [jsonForm.JsonFormMixin],
    props: {
        title: {
            type: String,
            default: null
        },
        subtitle: {
            type: String,
            default: null
        },
        submitButton: {
            type: String,
            default: 'Submit'
        },
        fillHeight: {
            type: Boolean,
            default: false
        },
        flat: {
            type: Boolean,
            default: false
        }
    },
    data()
    {
        return {
            me: this,
            submitProps: {
                form: this,
                validate: () => {
                    this.$v.$touch();
                },
                reset: () => {
                    this.$v.$reset();
                },
                submit: () => {
                    return this.doSubmit();
                },
                invalid: () => {
                    return this.$v.$invalid;
                },
                pending: () => {
                    return this.$v.$pending;
                },
                dirty: () => {
                    return this.$v.$dirty;
                }
            }
        };
    },
    computed: {
        heightStyle()
        {
            return this.fillHeight ? {'min-height': '100%'} : undefined;
        }
    }
};

/* script */
const __vue_script__$e = script$e;

/* template */
var __vue_render__$e = function () {var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;return _c('v-card',{style:(_vm.heightStyle),attrs:{"flat":_vm.flat}},[(_vm.title !== null || _vm.subtitle !== null)?_c('v-card-title',{attrs:{"primary-title":""}},[_c('div',[(_vm.title !== null)?_c('div',{staticClass:"headline"},[_vm._v(_vm._s(_vm.title))]):_vm._e(),_vm._v(" "),(_vm.subtitle !== null)?_c('div',[_vm._v(_vm._s(_vm.subtitle))]):_vm._e()])]):_vm._e(),_vm._v(" "),_c('v-card-text',[_c('v-form',{on:{"submit":function($event){$event.preventDefault();return _vm.doSubmit()}}},[(_vm.model !== null && _vm.items !== null)?_c('json-form-group',{ref:"formGroup",attrs:{"items":_vm.parsed.items,"model":_vm.model,"validator":_vm.validatorProxy,"validations-container":_vm.parsed.validator,"parent-validations-container":_vm.parsed.validator,"wrapper":_vm.me,"path":_vm.path}}):_vm._e(),_vm._v(" "),_c('input',{directives:[{name:"show",rawName:"v-show",value:(false),expression:"false"}],attrs:{"type":"submit"}})],1)],1),_vm._v(" "),_c('v-card-actions',[_vm._t("default",[_c('v-spacer'),_vm._v(" "),_c('v-btn',{attrs:{"color":"primary","disabled":_vm.processing || _vm.$v.$pending || (_vm.$v.$dirty && _vm.$v.$invalid),"loading":_vm.processing},on:{"click":function($event){$event.stopPropagation();return _vm.submitProps.submit()}}},[_vm._v("\n                "+_vm._s(_vm.submitButton)+"\n            ")])],{"submitDisabled":_vm.processing || _vm.$v.$pending || (_vm.$v.$dirty && _vm.$v.$invalid)},_vm.submitProps)],2),_vm._v(" "),_c('dialog-forms',{ref:"formOverlay",attrs:{"options":_vm.options,"parser":_vm.parser}})],1)};
var __vue_staticRenderFns__$e = [];

  /* style */
  const __vue_inject_styles__$e = undefined;
  /* scoped */
  const __vue_scope_id__$e = undefined;
  /* module identifier */
  const __vue_module_identifier__$e = undefined;
  /* functional template */
  const __vue_is_functional_template__$e = false;
  /* style inject */
  
  /* style inject SSR */
  

  
  var BlockForm = normalizeComponent(
    { render: __vue_render__$e, staticRenderFns: __vue_staticRenderFns__$e },
    __vue_inject_styles__$e,
    __vue_script__$e,
    __vue_scope_id__$e,
    __vue_is_functional_template__$e,
    __vue_module_identifier__$e,
    undefined,
    undefined
  );

const invalidStep = [() => false];

var StepperForm = {
    name: 'stepper-form',
    components: {DialogForms},
    mixins: [jsonForm.JsonMultiStepFormMixin],
    props: {
        nextButtonText: {
            type: [String, Object],
            default: 'Next'
        },
        finishButtonText: {
            type: [String, Object],
            default: 'Finish'
        },
        fillHeight: {
            type: Boolean,
            default: true
        },
        vertical: {
            type: Boolean,
            default: true
        }
    },
    render(h)
    {
        const children = [];
        if (this.vertical) {
            this.dataSteps.map((step, index) => {
                const id = this.$uniqueObjectId(step);
                children.push(this.genStepHeader(h, step, index, id));
                children.push(this.genStepContent(h, step, index, id, this.genForm(h, step, index, id), true));
            });
        } else {
            const headers = [];
            const items = [];
            this.dataSteps.map((step, index) => {
                const id = this.$uniqueObjectId(step);
                if (index > 0) {
                    headers.push(h('v-divider'));
                }
                headers.push(this.genStepHeader(h, step, index, id));
                items.push(this.genStepContent(h, step, index, id, this.genForm(h, step, index, id), false));
            });
            if (headers.length > 0) {
                children.push(h('v-stepper-header', headers));
                children.push(h('v-stepper-items', items));
            }
        }

        if (children.length === 0) {
            return null;
        }

        const formChildren = [
            h('input', {
                style: {display: 'none'},
                attrs: {
                    type: 'submit'
                }
            }),
            h('dialog-forms', {
                props: {
                    options: this.options,
                    parser: this.parse,
                },
                ref: 'formOverlay'
            })
        ];

        if (!this.locked) {
            formChildren.unshift(h('v-stepper', {
                style: this.heightStyle,
                props: {
                    vertical: this.vertical,
                    value: this.currentStep,
                },
                on: {
                    input: value => this.currentStep = value
                },
                ref: 'stepper'
            }, children));
        }

        return h('v-form', {
            style: this.heightStyle,
            on: {
                submit: (event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    if (this.currentDataStep) {
                        this.nextStep(this.currentDataStep, this.currentStep - 1);
                    }
                    return false;
                }
            }
        }, formChildren);
    },
    data()
    {
        return {
            showStepper: true,
            cachedForms: {},
        }
    },

    computed: {
        heightStyle()
        {
            return this.fillHeight ? {'min-height': '100%'} : undefined;
        }
    },
    watch: {
        vertical()
        {
            this.locked = true;
            this.$nextTick(() => this.locked = false);
        }
    },
    methods: {
        genStepHeader(h, step, index, id)
        {
            const children = [];
            if (step.title != null) {
                children.push(this.$intl.translate(step.title));
            }
            if (step.description != null && step.description !== '') {
                children.push(h('small', this.$intl.translate(step.description)));
            }
            return h('v-stepper-step', {
                key: id + 'h',
                props: {
                    complete: step.complete,
                    step: index + 1,
                    editable: step.editable && step.touched || this.stepHasError(step, index, true),
                    rules: this.stepHasError(step, index) ? invalidStep : undefined
                }
            }, children)
        },
        genStepContent(h, step, index, id, form, vertical)
        {
            const children = [];
            if (form != null) {
                children.push(form);
            }

            if (vertical) {
                children.push(this.genButton(h, step, index));
            } else {
                children.push(h('v-layout', [h('v-spacer'), this.genButton(h, step, index)]));
            }

            return h('v-stepper-content', {
                key: id + 'c',
                props: {
                    step: index + 1
                }
            }, children)
        },
        genButton(h, step, index)
        {
            return h('v-btn', {
                class: 'mt-4',
                props: {
                    disabled: this.processing || this.isButtonDisabled(step, index),
                    loading: this.processing || this.isButtonLoading(step, index),
                    color: 'primary'
                },
                on: {
                    click: (event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        this.nextStep(step, index);
                        return false;
                    }
                }
            }, this.$intl.translate(this.getButtonText(step, index)) || null);
        },
        genForm(h, step, index, id)
        {
            if (!step.parsed) {
                return null;
            }
            id = id + 'f';
            if (this.cachedForms.hasOwnProperty(id)) {
                return this.cachedForms[id];
            }
            return this.cachedForms[id] = h('json-form-group', {
                props: {
                    items: step.form || [],
                    model: this.dataValue[index],
                    name: step.name || undefined,
                    path: step.name ? [step.name] : [],
                    validationsContainer: step.validator,
                    parentValidationsContainer: step.validator,
                    validator: this.$v.dataValue[index],
                    wrapper: this
                },
                ref: 'formGroup',
                key: id
            });
        },
        getButtonText(step, index)
        {
            if (step.nextButton) {
                return step.nextButton;
            }
            return index + 1 === this.dataSteps.length ? this.finishButtonText : this.nextButtonText;
        },
        isButtonDisabled(step, index)
        {
            if (this.isButtonLoading(step, index) || this.stepHasError(step, index)) {
                return true;
            }

            return false;
        },
        isButtonLoading(step, index)
        {
            if (this.loadingStep === index + 1) {
                return true;
            }
            return step.parsed && this.$v.dataValue[index].$pending;
        }
    }
};

//

var script$f = {
    mixins: [jsonForm.JsonFormElementMixin],
    components: {ControlLabel, BlockError}
};

/* script */
const __vue_script__$f = script$f;

/* template */
var __vue_render__$f = function () {var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;return _c('div',[_c('control-label',{attrs:{"text":_vm.$intl.translate(_vm.display.title),"has-error":_vm.allErrors.length > 0,"required":_vm.config.required}}),_vm._v(" "),_vm._l((_vm.items),function(item){return _c('v-checkbox',{key:_vm.$uniqueObjectId(item),staticClass:"mt-0",attrs:{"value":item.value,"multiple":"","color":item.color || undefined,"label":_vm.$intl.translate(item.title),"prepend-icon":_vm.$controlIcon(item.icon),"hint":_vm.$intl.translate(item.description),"persistent-hint":""},model:{value:(_vm.model[_vm.name]),callback:function ($$v) {_vm.$set(_vm.model, _vm.name, $$v);},expression:"model[name]"}})}),_vm._v(" "),_c('block-error',{attrs:{"error":_vm.allErrors.length > 0 ? _vm.allErrors[0] : undefined}})],2)};
var __vue_staticRenderFns__$f = [];

  /* style */
  const __vue_inject_styles__$f = undefined;
  /* scoped */
  const __vue_scope_id__$f = undefined;
  /* module identifier */
  const __vue_module_identifier__$f = undefined;
  /* functional template */
  const __vue_is_functional_template__$f = false;
  /* style inject */
  
  /* style inject SSR */
  

  
  var CheckboxMultiControl = normalizeComponent(
    { render: __vue_render__$f, staticRenderFns: __vue_staticRenderFns__$f },
    __vue_inject_styles__$f,
    __vue_script__$f,
    __vue_scope_id__$f,
    __vue_is_functional_template__$f,
    __vue_module_identifier__$f,
    undefined,
    undefined
  );

//

var script$g = {
    mixins: [jsonForm.JsonFormElementMixin]
};

/* script */
const __vue_script__$g = script$g;

/* template */
var __vue_render__$g = function () {var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;return _c('v-switch',{staticClass:"mt-0",attrs:{"error-messages":_vm.allErrors,"color":_vm.display.color || undefined,"label":_vm.$intl.translate(_vm.display.title),"prepend-icon":_vm.$controlIcon(_vm.display.prependIcon),"append-icon":_vm.$controlIcon(_vm.display.appendIcon),"hint":_vm.$intl.translate(_vm.display.hint),"persistent-hint":"","false-value":false,"true-value":true,"required":_vm.config.required},on:{"blur":function($event){return _vm.validate()}},model:{value:(_vm.model[_vm.name]),callback:function ($$v) {_vm.$set(_vm.model, _vm.name, $$v);},expression:"model[name]"}})};
var __vue_staticRenderFns__$g = [];

  /* style */
  const __vue_inject_styles__$g = undefined;
  /* scoped */
  const __vue_scope_id__$g = undefined;
  /* module identifier */
  const __vue_module_identifier__$g = undefined;
  /* functional template */
  const __vue_is_functional_template__$g = false;
  /* style inject */
  
  /* style inject SSR */
  

  
  var SwitchControl = normalizeComponent(
    { render: __vue_render__$g, staticRenderFns: __vue_staticRenderFns__$g },
    __vue_inject_styles__$g,
    __vue_script__$g,
    __vue_scope_id__$g,
    __vue_is_functional_template__$g,
    __vue_module_identifier__$g,
    undefined,
    undefined
  );

//

var script$h = {
    mixins: [jsonForm.JsonFormElementMixin],
    mounted()
    {
        if (this.model.hasOwnProperty(this.name)) {
            const exists = this.items.some(item => this.$equals(this.modelProxy, item.value));
            if (!exists) {
                this.$delete(this.model, this.name);
            }
        }
    }
};

/* script */
const __vue_script__$h = script$h;

/* template */
var __vue_render__$h = function () {var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;return _c('v-radio-group',{attrs:{"column":!_vm.display.inline,"row":!!_vm.display.inline,"label":_vm.$intl.translate(_vm.display.title),"error-messages":_vm.allErrors,"value-comparator":_vm.$equals,"mandatory":!!_vm.config.required},model:{value:(_vm.model[_vm.name]),callback:function ($$v) {_vm.$set(_vm.model, _vm.name, $$v);},expression:"model[name]"}},_vm._l((_vm.items),function(item,index){return _c('v-radio',{key:index,class:{'ml-1': index === 0 && !!_vm.display.inline},attrs:{"label":_vm.$intl.translate(item.title),"value":item.value,"color":item.color || _vm.display.color || undefined}})}),1)};
var __vue_staticRenderFns__$h = [];

  /* style */
  const __vue_inject_styles__$h = undefined;
  /* scoped */
  const __vue_scope_id__$h = undefined;
  /* module identifier */
  const __vue_module_identifier__$h = undefined;
  /* functional template */
  const __vue_is_functional_template__$h = false;
  /* style inject */
  
  /* style inject SSR */
  

  
  var RadioControl = normalizeComponent(
    { render: __vue_render__$h, staticRenderFns: __vue_staticRenderFns__$h },
    __vue_inject_styles__$h,
    __vue_script__$h,
    __vue_scope_id__$h,
    __vue_is_functional_template__$h,
    __vue_module_identifier__$h,
    undefined,
    undefined
  );

//

var script$i = {
    mixins: [jsonForm.JsonFormElementMixin],
    data()
    {
        return {
            translatedItems: []
        };
    },
    created()
    {
        this.translatedItems = this.translateItems(this.items);
    },
    methods: {
        removeChip(data)
        {
            if (this.config.multiple) {
                data.parent.selectItem(data.item);
            }
            else {
                this.$delete(this.model, this.name);
            }
        },
        isItemSelected(data)
        {
            if (this.config.multiple) {
                return data.parent.selectedItems.indexOf(data.item) > -1;
            }
            return data.parent.selectedItem === data.item;
        },
        translateItems(items)
        {
            return items.map(item => {
                if (!item.hasOwnProperty(this.valueProp)) {
                    if (item.hasOwnProperty('header')) {
                        return {header: this.$intl.translate(item.header)};
                    }
                    return item;
                }
                item = {...item};
                item[this.titleProp] = this.$intl.translate(item[this.titleProp]);
                item[this.descriptionProp] = this.$intl.translate(item[this.descriptionProp]);
                if (item[this.iconProp]) {
                    item[this.iconProp] = this.$controlIcon(item[this.iconProp]);
                }
                return item;
            });
        }
    },
    computed: {
        titleProp()
        {
            return this.config.titleProp || 'title';
        },
        valueProp()
        {
            return this.config.valueProp || 'value';
        },
        descriptionProp()
        {
            return this.config.descriptionProp || 'description';
        },
        iconProp()
        {
            return this.config.iconProp || 'icon';
        },
        itemsProp()
        {
            return this.config.itemsProp || 'items';
        }
    }
};

/* script */
const __vue_script__$i = script$i;

/* template */
var __vue_render__$i = function () {var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;return _c('v-select',{attrs:{"error-messages":_vm.allErrors,"loading":_vm.translatedItems.length === 0,"label":_vm.$intl.translate(_vm.display.title),"hint":_vm.$intl.translate(_vm.display.hint),"persistent-hint":"","placeholder":_vm.$intl.translate(_vm.display.placeholder),"prepend-inner-icon":_vm.$controlIcon(_vm.display.prependIcon),"prepend-icon":_vm.$controlIcon(_vm.display.prependOuterIcon),"append-icon":_vm.$controlIcon(_vm.display.appendIcon),"append-outer-icon":_vm.$controlIcon(_vm.display.appendOuterIcon),"multiple":_vm.config.multiple || false,"required":_vm.config.required,"items":_vm.translatedItems,"item-value":_vm.valueProp,"item-text":_vm.titleProp,"item-avatar":_vm.iconProp,"value-comparator":_vm.$equals,"clearable":!!_vm.display.clearable,"color":_vm.display.color || undefined,"box":_vm.display.appearance === 'box',"solo":_vm.display.appearance === 'solo',"solo-inverted":_vm.display.appearance === 'solo-inverted',"outline":_vm.display.appearance === 'outline',"flat":!!_vm.display.flat},scopedSlots:_vm._u([{key:_vm.display.chips ? 'selection' : undefined,fn:function(data){return (!!_vm.display.chips)?[(_vm.config.multiple)?_c('v-chip',{key:_vm.$uniqueObjectId(data.item),attrs:{"close":"","selected":data.selected,"disabled":data.disabled},on:{"input":function($event){return _vm.removeChip(data)}}},[(_vm.display.icons && !!data.item[_vm.iconProp])?_c('v-avatar',{staticClass:"accent"},[_c('v-icon',[_vm._v(_vm._s(_vm.$controlIcon(data.item[_vm.iconProp])))])],1):_vm._e(),_vm._v("\n            "+_vm._s(data.item[_vm.titleProp])+"\n        ")],1):[(_vm.display.icons && !!data.item[_vm.iconProp])?_c('v-icon',{staticClass:"mr-1"},[_vm._v("\n                "+_vm._s(_vm.$controlIcon(data.item[_vm.iconProp]))+"\n            ")]):_vm._e(),_vm._v(" "),_c('span',{staticClass:"grey--text text--darken-4"},[_vm._v(_vm._s(data.item[_vm.titleProp]))])]]:undefined}},{key:_vm.display.icons ? 'item' : undefined,fn:function(data){return (_vm.display.icons === true)?[_c('v-list-tile-avatar',[(!!data.item[_vm.iconProp])?_c('v-icon',{attrs:{"color":_vm.isItemSelected(data) ? 'accent' : undefined}},[_vm._v("\n                "+_vm._s(_vm.$controlIcon(data.item[_vm.iconProp]))+"\n            ")]):_vm._e()],1),_vm._v(" "),_c('v-list-tile-content',{attrs:{"color":_vm.isItemSelected(data) ? 'accent' : undefined}},[_c('v-list-tile-title',[_vm._v("\n                "+_vm._s(data.item[_vm.titleProp])+"\n            ")]),_vm._v(" "),_c('v-list-tile-sub-title',[_vm._v("\n                "+_vm._s(data.item[_vm.descriptionProp])+"\n            ")])],1)]:undefined}}],null,true),model:{value:(_vm.model[_vm.name]),callback:function ($$v) {_vm.$set(_vm.model, _vm.name, $$v);},expression:"model[name]"}})};
var __vue_staticRenderFns__$i = [];

  /* style */
  const __vue_inject_styles__$i = undefined;
  /* scoped */
  const __vue_scope_id__$i = undefined;
  /* module identifier */
  const __vue_module_identifier__$i = undefined;
  /* functional template */
  const __vue_is_functional_template__$i = false;
  /* style inject */
  
  /* style inject SSR */
  

  
  var SelectControl = normalizeComponent(
    { render: __vue_render__$i, staticRenderFns: __vue_staticRenderFns__$i },
    __vue_inject_styles__$i,
    __vue_script__$i,
    __vue_scope_id__$i,
    __vue_is_functional_template__$i,
    __vue_module_identifier__$i,
    undefined,
    undefined
  );

//

var script$j = {
    mixins: [jsonForm.JsonFormElementMixin],
    data()
    {
        return {
            search: null
        }
    }
};

/* script */
const __vue_script__$j = script$j;

/* template */
var __vue_render__$j = function () {var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;return _c('v-combobox',{attrs:{"error-messages":_vm.allErrors,"label":_vm.$intl.translate(_vm.display.title),"suffix":_vm.$intl.translate(_vm.display.suffix),"prefix":_vm.$intl.translate(_vm.display.prefix),"prepend-inner-icon":_vm.$controlIcon(_vm.display.prependIcon),"prepend-icon":_vm.$controlIcon(_vm.display.prependOuterIcon),"append-icon":_vm.$controlIcon(_vm.display.appendIcon),"append-outer-icon":_vm.$controlIcon(_vm.display.appendOuterIcon),"hint":_vm.$intl.translate(_vm.display.hint),"placeholder":_vm.$intl.translate(_vm.display.placeholder),"box":_vm.display.appearance === 'box',"solo":_vm.display.appearance === 'solo',"solo-inverted":_vm.display.appearance === 'solo-inverted',"outline":_vm.display.appearance === 'outline',"flat":!!_vm.display.flat,"chips":Boolean(_vm.display.chips && _vm.config.multiple),"deletable-chips":"","color":_vm.display.color || undefined,"items":_vm.items,"search-input":_vm.search,"multiple":!!_vm.config.multiple},on:{"blur":function($event){return _vm.validate()},"update:searchInput":function($event){_vm.search=$event;},"update:search-input":function($event){_vm.search=$event;}},model:{value:(_vm.model[_vm.name]),callback:function ($$v) {_vm.$set(_vm.model, _vm.name, $$v);},expression:"model[name]"}})};
var __vue_staticRenderFns__$j = [];

  /* style */
  const __vue_inject_styles__$j = undefined;
  /* scoped */
  const __vue_scope_id__$j = undefined;
  /* module identifier */
  const __vue_module_identifier__$j = undefined;
  /* functional template */
  const __vue_is_functional_template__$j = false;
  /* style inject */
  
  /* style inject SSR */
  

  
  var ComboboxControl = normalizeComponent(
    { render: __vue_render__$j, staticRenderFns: __vue_staticRenderFns__$j },
    __vue_inject_styles__$j,
    __vue_script__$j,
    __vue_scope_id__$j,
    __vue_is_functional_template__$j,
    __vue_module_identifier__$j,
    undefined,
    undefined
  );

//

var script$k = {
    mixins: [jsonForm.JsonFormElementMixin],
    computed: {
        outline() {
            return this.display.hasOwnProperty('outline') ? Boolean(this.display.outline) : true;
        },
        color() {
            return this.display.color || 'info';
        },
        icon() {
            if (this.display.icon) {
                return this.$controlIcon(this.display.icon);
            }

            switch (this.color) {
                case 'success':
                    return 'check_circle';
                case 'info':
                    return 'info';
                case 'warning':
                    return 'warning';
                case 'error':
                    return 'error';
            }

            return undefined;
        }
    }
};

/* script */
const __vue_script__$k = script$k;

/* template */
var __vue_render__$k = function () {var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;return _c('v-alert',{attrs:{"value":true,"outline":_vm.outline,"color":_vm.color,"icon":_vm.icon}},[(_vm.display.title != null)?_c('div',{staticClass:"title",domProps:{"textContent":_vm._s(_vm.$intl.translate(_vm.display.title))}}):_vm._e(),_vm._v(" "),(_vm.display.text != null)?_c('div',{domProps:{"innerHTML":_vm._s(_vm.$intl.translate(_vm.display.text))}}):_vm._e()])};
var __vue_staticRenderFns__$k = [];

  /* style */
  const __vue_inject_styles__$k = undefined;
  /* scoped */
  const __vue_scope_id__$k = undefined;
  /* module identifier */
  const __vue_module_identifier__$k = undefined;
  /* functional template */
  const __vue_is_functional_template__$k = false;
  /* style inject */
  
  /* style inject SSR */
  

  
  var DescriptionControl = normalizeComponent(
    { render: __vue_render__$k, staticRenderFns: __vue_staticRenderFns__$k },
    __vue_inject_styles__$k,
    __vue_script__$k,
    __vue_scope_id__$k,
    __vue_is_functional_template__$k,
    __vue_module_identifier__$k,
    undefined,
    undefined
  );

//

const DEVICES = ['xs', 'sm', 'md', 'lg', 'xl'];

var script$l = {
    mixins: [jsonForm.JsonFormElementMixin],
    components: {JsonFormElement: jsonForm.JsonFormElement},
    computed: {
        colProps()
        {
            let p = {};
            if (this.display.size) {
                this.setDeviceProps(p, this.display.size, '', 'md');
            }
            if (this.display.offset) {
                this.setDeviceProps(p, this.display.offset, 'offset-', 'offset-md');
            }
            return p;
        }
    },
    methods: {
        setDeviceProps(container, props, prefix, default_prefix = null)
        {
            if (typeof props === 'object') {
                DEVICES.map(d => {
                    if (props.hasOwnProperty(d)) {
                        container[prefix + d + props[d]] = true;
                    }
                });
            }
            else {
                if (props && default_prefix) {
                    container[default_prefix + props] = true;
                }
            }
        },
        onRouteLeave(func)
        {
            return func(this.$refs.formElement);
        }
    }
};

/* script */
const __vue_script__$l = script$l;

/* template */
var __vue_render__$l = function () {var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;return _c('v-flex',_vm._b({staticClass:"pb-0"},'v-flex',_vm.colProps,false),_vm._l((_vm.items),function(item,index){return _c('json-form-element',{key:_vm.$uniqueObjectId(item, index),ref:"formElement",refInFor:true,attrs:{"control":item,"model":_vm.modelProxy,"validator":_vm.validatorProxy,"wrapper":_vm.wrapper,"path":_vm.path,"parent-validations-container":_vm.parentValidationsContainer,"validations-container":_vm.validationsContainer}})}),1)};
var __vue_staticRenderFns__$l = [];

  /* style */
  const __vue_inject_styles__$l = undefined;
  /* scoped */
  const __vue_scope_id__$l = undefined;
  /* module identifier */
  const __vue_module_identifier__$l = undefined;
  /* functional template */
  const __vue_is_functional_template__$l = false;
  /* style inject */
  
  /* style inject SSR */
  

  
  var ColControl = normalizeComponent(
    { render: __vue_render__$l, staticRenderFns: __vue_staticRenderFns__$l },
    __vue_inject_styles__$l,
    __vue_script__$l,
    __vue_scope_id__$l,
    __vue_is_functional_template__$l,
    __vue_module_identifier__$l,
    undefined,
    undefined
  );

//

var script$m = {
    mixins: [jsonForm.JsonFormElementMixin],
    components: {JsonFormElement: jsonForm.JsonFormElement},
    methods: {
        onRouteLeave(func)
        {
            return func(this.$refs.formElement);
        }
    }
};

/* script */
const __vue_script__$m = script$m;

/* template */
var __vue_render__$m = function () {var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;return _c('v-container',{staticClass:"px-0 py-0",attrs:{"fluid":"","grid-list-xl":""}},[_c('v-layout',{attrs:{"row":"","wrap":""}},_vm._l((_vm.items),function(item,index){return _c('json-form-element',{key:_vm.$uniqueObjectId(item, index),ref:"formElement",refInFor:true,attrs:{"control":item,"model":_vm.modelProxy,"validator":_vm.validatorProxy,"wrapper":_vm.wrapper,"path":_vm.path,"parent-validations-container":_vm.parentValidationsContainer,"validations-container":_vm.validationsContainer}})}),1)],1)};
var __vue_staticRenderFns__$m = [];

  /* style */
  const __vue_inject_styles__$m = undefined;
  /* scoped */
  const __vue_scope_id__$m = undefined;
  /* module identifier */
  const __vue_module_identifier__$m = undefined;
  /* functional template */
  const __vue_is_functional_template__$m = false;
  /* style inject */
  
  /* style inject SSR */
  

  
  var RowControl = normalizeComponent(
    { render: __vue_render__$m, staticRenderFns: __vue_staticRenderFns__$m },
    __vue_inject_styles__$m,
    __vue_script__$m,
    __vue_scope_id__$m,
    __vue_is_functional_template__$m,
    __vue_module_identifier__$m,
    undefined,
    undefined
  );

//

var script$n = {
    mixins: [jsonForm.JsonFormElementMixin],
    components: {JsonFormGroup: jsonForm.JsonFormGroup, ControlLabel},
    methods: {
        onRouteLeave(func)
        {
            return func(this.$refs.formGroup);
        }
    }
};

/* script */
const __vue_script__$n = script$n;

/* template */
var __vue_render__$n = function () {var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;return (_vm.display.panel === true)?_c('v-expansion-panel',{attrs:{"expand":""}},[_c('v-expansion-panel-content',[_c('div',{attrs:{"slot":"header"},slot:"header"},[_vm._v(_vm._s(_vm.$intl.translate(_vm.display.title)))]),_vm._v(" "),_c('json-form-group',{ref:"formGroup",staticClass:"px-2",attrs:{"model":_vm.modelProxy,"validator":_vm.validatorProxy,"items":_vm.items,"wrapper":_vm.wrapper,"path":_vm.path,"parent-validations-container":_vm.parentValidationsContainer,"validations-container":_vm.validationsContainer}})],1)],1):_c('div',[(!!_vm.display.title)?_c('v-subheader',{staticClass:"mb-0"},[_c('control-label',{attrs:{"text":_vm.$intl.translate(_vm.display.title)}})],1):_vm._e(),_vm._v(" "),_c('json-form-group',{ref:"formGroup",attrs:{"model":_vm.modelProxy,"validator":_vm.validatorProxy,"items":_vm.items,"wrapper":_vm.wrapper,"path":_vm.path,"parent-validations-container":_vm.parentValidationsContainer,"validations-container":_vm.validationsContainer}})],1)};
var __vue_staticRenderFns__$n = [];

  /* style */
  const __vue_inject_styles__$n = undefined;
  /* scoped */
  const __vue_scope_id__$n = undefined;
  /* module identifier */
  const __vue_module_identifier__$n = undefined;
  /* functional template */
  const __vue_is_functional_template__$n = false;
  /* style inject */
  
  /* style inject SSR */
  

  
  var GroupControl = normalizeComponent(
    { render: __vue_render__$n, staticRenderFns: __vue_staticRenderFns__$n },
    __vue_inject_styles__$n,
    __vue_script__$n,
    __vue_scope_id__$n,
    __vue_is_functional_template__$n,
    __vue_module_identifier__$n,
    undefined,
    undefined
  );

//

var script$o = {
    mixins: [jsonForm.JsonFormElementMixin],
    components: {JsonFormGroup: jsonForm.JsonFormGroup},
    data() {
        return {
            switchValue: this.model[this.name] != null,
            lastModel: {}
        };
    },
    created()
    {
        this.switchValue = this.modelProxy != null;
    },
    watch: {
        switchValue(val) {
            if (val) {
                this.$set(this.model, this.name, this.lastModel || {});
            }
            else {
                this.lastModel = this.$clone(this.modelProxy);
                this.$set(this.model, this.name, null);
                this.validate();
            }
        },
        modelProxy(val) {
            if (val == null) {
                this.switchValue = false;
            }
            else if (!this.switchValue) {
                this.switchValue = true;
            }
        }
    },
    computed: {
        validations()
        {
            return this.parsed.validators;
        },
        parsed()
        {
            const validators = {};
            if (!this.switchValue) {
                return {
                    validators,
                    items: []
                };
            }
            return {
                validators,
                items: this.wrapper.parser.parseControlList(this.items, validators)
            };
        },
        switchErrors()
        {
            return this.switchValue ? [] : this.allErrors;
        }
    },
    methods: {
        onRouteLeave(func)
        {
            if (this.modelProxy == null) {
                return true;
            }
            return func(this.$refs.formGroup);
        }
    }
};

/* script */
const __vue_script__$o = script$o;

/* template */
var __vue_render__$o = function () {var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;return _c('div',[_c('v-switch',{attrs:{"color":_vm.display.color || undefined,"label":_vm.$intl.translate(_vm.display.title),"prepend-icon":_vm.$controlIcon(_vm.display.prependIcon),"append-icon":_vm.$controlIcon(_vm.display.appendIcon),"hint":_vm.$intl.translate(_vm.display.hint),"persistent-hint":"","error-messages":_vm.switchErrors,"required":_vm.config.required},model:{value:(_vm.switchValue),callback:function ($$v) {_vm.switchValue=$$v;},expression:"switchValue"}}),_vm._v(" "),_c('json-form-group',{ref:"formGroup",attrs:{"model":_vm.modelProxy,"validator":_vm.validatorProxy,"items":_vm.parsed.items,"wrapper":_vm.wrapper,"path":_vm.path,"parent-validations-container":_vm.parentValidationsContainer,"validations-container":_vm.validationsContainer}})],1)};
var __vue_staticRenderFns__$o = [];

  /* style */
  const __vue_inject_styles__$o = undefined;
  /* scoped */
  const __vue_scope_id__$o = undefined;
  /* module identifier */
  const __vue_module_identifier__$o = undefined;
  /* functional template */
  const __vue_is_functional_template__$o = false;
  /* style inject */
  
  /* style inject SSR */
  

  
  var SwitchGroupControl = normalizeComponent(
    { render: __vue_render__$o, staticRenderFns: __vue_staticRenderFns__$o },
    __vue_inject_styles__$o,
    __vue_script__$o,
    __vue_scope_id__$o,
    __vue_is_functional_template__$o,
    __vue_module_identifier__$o,
    undefined,
    undefined
  );

//

var script$p = {
    mixins: [jsonForm.JsonFormElementMixin],
    components: {JsonFormGroup: jsonForm.JsonFormGroup},
    data()
    {
        return {
            tabPrefix: this.$uniqueObjectId(this)
        }
    },
    methods: {
        tabHasError(tab, dirty = false)
        {
            if (tab.name) {
                const v = this.validatorProxy[tab.name];
                if (!v || !dirty && !v.$dirty) {
                    return false;
                }
                return v.$invalid;
            }

            const f = (item, validator) => {
                if (item.config && Array.isArray(item.config.regions)) {
                    return item.config.some(region => {
                        const v = validator[region.name];
                        if (!v || !dirty && !v.$dirty) {
                            return false;
                        }
                        return v.$invalid;
                    });
                }
                if (!Array.isArray(item.items)) {
                    return false;
                }
                return item.items.some(subitem => {
                    if (subitem.name !== null) {
                        if (!dirty && !validator.$dirty) {
                            return false;
                        }
                        return validator.$invalid;
                    }
                    return f(subitem, validator);
                });
            };

            return f(tab, this.validatorProxy);
        },
        onRouteLeave(func)
        {
            return func(this.$refs.formGroup);
        }
    },
    created()
    {
        this.items.map(item => {
            if (item.name && !this.modelProxy.hasOwnProperty(item.name)) {
                this.$set(this.modelProxy, item.name, {});
            }
        });
    },
    destroyed()
    {
        this.items.map(item => {
            if (item.name) {
                this.$delete(this.modelProxy, item.name);
            }
        });
    }
};

/* script */
const __vue_script__$p = script$p;

/* template */
var __vue_render__$p = function () {var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;return _c('v-tabs',{attrs:{"right":_vm.display.position === 'right',"centered":_vm.display.position === 'center',"fixed-tabs":_vm.display.position === 'fixed',"icons-and-text":!!_vm.display.verticalIcons,"color":_vm.display.color || undefined,"dark":_vm.display.dark || undefined,"show-arrows":!!_vm.display.sliderArrows}},[_c('v-tabs-slider',{attrs:{"color":_vm.display.sliderColor || undefined}}),_vm._v(" "),_vm._l((_vm.items),function(item,key){return _c('v-tab',{key:_vm.$uniqueObjectId(item, key)},[(_vm.display.verticalIcons)?[_vm._v("\n            "+_vm._s(_vm.$intl.translate(item.title))+"\n        ")]:_vm._e(),_vm._v(" "),(_vm.tabHasError(item))?_c('v-icon',{attrs:{"color":"red"}},[_vm._v("error")]):(item.icon)?_c('v-icon',[_vm._v(_vm._s(_vm.$controlIcon(item.icon)))]):_vm._e(),_vm._v(" "),(!_vm.display.verticalIcons)?[_vm._v("\n            "+_vm._s(_vm.$intl.translate(item.title))+"\n        ")]:_vm._e()],2)}),_vm._v(" "),_c('v-tabs-items',{staticClass:"mt-1"},_vm._l((_vm.items),function(item,key){return _c('v-tab-item',{key:_vm.$uniqueObjectId(item, key),staticClass:"px-1"},[_c('json-form-group',{ref:"formGroup",refInFor:true,attrs:{"model":_vm.modelProxy,"validator":_vm.validatorProxy,"items":item.items,"name":item.name,"wrapper":_vm.wrapper,"path":_vm.path,"parent-validations-container":_vm.parentValidationsContainer,"validations-container":_vm.validationsContainer}})],1)}),1)],2)};
var __vue_staticRenderFns__$p = [];

  /* style */
  const __vue_inject_styles__$p = undefined;
  /* scoped */
  const __vue_scope_id__$p = undefined;
  /* module identifier */
  const __vue_module_identifier__$p = undefined;
  /* functional template */
  const __vue_is_functional_template__$p = false;
  /* style inject */
  
  /* style inject SSR */
  

  
  var TabsControl = normalizeComponent(
    { render: __vue_render__$p, staticRenderFns: __vue_staticRenderFns__$p },
    __vue_inject_styles__$p,
    __vue_script__$p,
    __vue_scope_id__$p,
    __vue_is_functional_template__$p,
    __vue_module_identifier__$p,
    undefined,
    undefined
  );

//

var script$q = {
    mixins: [jsonForm.JsonFormElementMixin],
    components: {JsonFormGroup: jsonForm.JsonFormGroup},
    data()
    {
        return {
            asyncFields: null,
            asyncValidator: null
        }
    },
    beforeDestroy()
    {
        this.asyncFields = null;
        this.asyncValidator = null;
    },
    created()
    {
        this.loadFields();
    },
    computed: {
        validations()
        {
            return this.asyncValidator;
        }
    },
    methods: {
        loadFields()
        {
            if (typeof this.config.loader !== 'function') {
                return;
            }
            const fields = this.config.loader(this);
            if (!(fields instanceof Promise)) {
                return;
            }
            this.asyncValidator = fields
                .then(fields => {
                    const validator = {};
                    this.asyncFields = this.wrapper.parser.parseControlList(this.$clone(fields), validator);
                    return validator;
                });
        },
        onRouteLeave(func)
        {
            if (this.asyncFields === null) {
                return true;
            }
            return func(this.$refs.formGroup);
        }
    }
};

/* script */
const __vue_script__$q = script$q;

/* template */
var __vue_render__$q = function () {var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;return (_vm.asyncFields !== null)?_c('json-form-group',{ref:"formGroup",attrs:{"model":_vm.modelProxy,"items":_vm.asyncFields,"validator":_vm.validatorProxy,"path":_vm.path,"wrapper":_vm.wrapper,"parent-validations-container":_vm.parentValidationsContainer,"validations-container":_vm.validationsContainer}}):_c('v-progress-linear',{attrs:{"indeterminate":""}})};
var __vue_staticRenderFns__$q = [];

  /* style */
  const __vue_inject_styles__$q = undefined;
  /* scoped */
  const __vue_scope_id__$q = undefined;
  /* module identifier */
  const __vue_module_identifier__$q = undefined;
  /* functional template */
  const __vue_is_functional_template__$q = false;
  /* style inject */
  
  /* style inject SSR */
  

  
  var AsyncGroupControl = normalizeComponent(
    { render: __vue_render__$q, staticRenderFns: __vue_staticRenderFns__$q },
    __vue_inject_styles__$q,
    __vue_script__$q,
    __vue_scope_id__$q,
    __vue_is_functional_template__$q,
    __vue_module_identifier__$q,
    undefined,
    undefined
  );

var ComponentControl = {
    mixins: [jsonForm.JsonFormElementMixin],
    computed: {
        form()
        {
            return {
                name: this.name,
                validator: this.validator,
                model: this.model,
                config: this.config,
                display: this.display,
                wrapper: this.wrapper,
                path: this.path,
                validationsContainer: this.validationsContainer,
                parentValidationsContainer: this.parentValidationsContainer,
            }
        }
    },
    render(h)
    {
        const component = this.config.component;
        const data = this.config.data || {};
        const alias = this.config.alias || 'form';
        if (!data.props) {
            data.props = {};
        }
        if (this.config.props) {
            Object.assign(data.props, this.config.props);
        }
        data.props[alias] = this.form;
        return h(component, data);
    }
};

//

var script$r = {
    mixins: [jsonForm.JsonFormElementMixin],
    data()
    {
        return {
            showDialog: false,
            dateFormatted: null,
            dateModel: null
        }
    },
    watch: {
        modelProxy(value)
        {
            if (!value) {
                this.dateFormatted = null;
                return;
            }
            this.dateModel = value;
            this.dateFormatted = this.formatDate(this.dateModel);
        }
    },
    computed: {
        landscape()
        {
            if (!this.display.landscape) {
                return false;
            }
            return this.$vuetify.breakpoint.mdAndUp || false;
        },
        locale()
        {
            if (this.config.locale) {
                return this.config.locale;
            }
            return this.$intl.language || 'en';
        },
        firstDayOfWeek()
        {
            if (this.config.firstDayOfWeek) {
                return this.config.firstDayOfWeek;
            }
            return this.$intl.firstDayOfWeek || 0;
        }
    },
    mounted()
    {
        this.dateModel = this.modelProxy;
        this.updateValue(false);
    },
    methods: {
        handleClear()
        {
            this.dateModel = null;
            this.$delete(this.model, this.name);
        },
        onSave()
        {
            this.showDialog = false;
            this.updateValue();
        },
        onCancel()
        {
            this.showDialog = false;
            if (this.modelProxy) {
                this.dateModel = this.modelProxy;
            }
        },
        updateValue(validate = true)
        {
            this.$set(this.model, this.name, this.dateModel);
            this.dateFormatted = this.formatDate(this.dateModel);
            validate && this.validate();
        },
        formatDate(date)
        {
            if (!date) {
                return null;
            }
            return (new Date(date)).toLocaleDateString(this.locale);
        },
        onRouteLeave(func)
        {
            if (!this.showDialog) {
                return true;
            }
            this.onCancel();
            return false;
        }
    }
};

/* script */
const __vue_script__$r = script$r;

/* template */
var __vue_render__$r = function () {var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;return _c('v-dialog',{attrs:{"persistent":"","lazy":"","full-width":"","width":_vm.landscape ? 460 : 290},model:{value:(_vm.showDialog),callback:function ($$v) {_vm.showDialog=$$v;},expression:"showDialog"}},[_c('v-text-field',{attrs:{"slot":"activator","readonly":"","error-messages":_vm.allErrors,"label":_vm.$intl.translate(_vm.display.title),"suffix":_vm.$intl.translate(_vm.display.suffix),"prefix":_vm.$intl.translate(_vm.display.prefix),"hint":_vm.$intl.translate(_vm.display.hint),"persistent-hint":"","prepend-inner-icon":_vm.$controlIcon(_vm.display.prependIcon),"prepend-icon":_vm.$controlIcon(_vm.display.prependOuterIcon),"append-icon":_vm.$controlIcon(_vm.display.appendIcon) || 'event',"append-outer-icon":_vm.$controlIcon(_vm.display.appendOuterIcon),"clearable":"","box":_vm.display.appearance === 'box',"solo":_vm.display.appearance === 'solo',"solo-inverted":_vm.display.appearance === 'solo-inverted',"outline":_vm.display.appearance === 'outline',"color":_vm.display.color || undefined,"flat":!!_vm.display.flat,"required":_vm.config.required},on:{"input":function($event){($event === null) && _vm.handleClear();}},slot:"activator",model:{value:(_vm.dateFormatted),callback:function ($$v) {_vm.dateFormatted=$$v;},expression:"dateFormatted"}}),_vm._v(" "),_c('v-date-picker',{attrs:{"min":_vm.config.minDate,"max":_vm.config.maxDate,"locale":_vm.locale,"first-day-of-week":_vm.firstDayOfWeek,"color":_vm.display.color || undefined,"landscape":_vm.landscape,"scrollable":""},model:{value:(_vm.dateModel),callback:function ($$v) {_vm.dateModel=$$v;},expression:"dateModel"}},[_c('v-spacer'),_vm._v(" "),_c('v-btn',{attrs:{"flat":"","icon":"","color":"red"},on:{"click":function($event){$event.stopPropagation();return _vm.onCancel()}}},[_c('v-icon',[_vm._v("clear")])],1),_vm._v(" "),_c('v-btn',{attrs:{"flat":"","icon":"","color":"green"},on:{"click":function($event){$event.stopPropagation();return _vm.onSave()}}},[_c('v-icon',[_vm._v("check")])],1)],1)],1)};
var __vue_staticRenderFns__$r = [];

  /* style */
  const __vue_inject_styles__$r = undefined;
  /* scoped */
  const __vue_scope_id__$r = undefined;
  /* module identifier */
  const __vue_module_identifier__$r = undefined;
  /* functional template */
  const __vue_is_functional_template__$r = false;
  /* style inject */
  
  /* style inject SSR */
  

  
  var DateControl = normalizeComponent(
    { render: __vue_render__$r, staticRenderFns: __vue_staticRenderFns__$r },
    __vue_inject_styles__$r,
    __vue_script__$r,
    __vue_scope_id__$r,
    __vue_is_functional_template__$r,
    __vue_module_identifier__$r,
    undefined,
    undefined
  );

//

var script$s = {
    mixins: [jsonForm.JsonFormElementMixin],
    data()
    {
        return {
            showDialog: false,
            timeModel: '00:00'
        }
    },
    mounted()
    {
        this.timeModel = this.modelProxy;
        this.updateValue(false);
    },
    computed: {
        landscape()
        {
            if (!this.display.landscape) {
                return false;
            }
            return this.$vuetify.breakpoint.mdAndUp || false;
        }
    },
    methods: {
        handleClear()
        {
            this.timeModel = '00:00';
            this.$delete(this.model, this.name);
        },
        onSave()
        {
            this.showDialog = false;
            this.updateValue();
        },
        onCancel()
        {
            this.showDialog = false;
            this.timeModel = this.modelProxy || '00:00';
        },
        updateValue(validate = true)
        {
            this.$set(this.model, this.name, this.timeModel);
            validate && this.validate();
        },
        onRouteLeave(func)
        {
            if (!this.showDialog) {
                return true;
            }
            this.onCancel();
            return false;
        }
    }
};

/* script */
const __vue_script__$s = script$s;

/* template */
var __vue_render__$s = function () {var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;return _c('v-dialog',{attrs:{"persistent":"","lazy":"","full-width":"","width":_vm.landscape ? 460 : 290},model:{value:(_vm.showDialog),callback:function ($$v) {_vm.showDialog=$$v;},expression:"showDialog"}},[_c('v-text-field',{attrs:{"slot":"activator","readonly":"","error-messages":_vm.allErrors,"label":_vm.$intl.translate(_vm.display.title),"suffix":_vm.$intl.translate(_vm.display.suffix),"prefix":_vm.$intl.translate(_vm.display.prefix),"prepend-inner-icon":_vm.$controlIcon(_vm.display.prependIcon),"prepend-icon":_vm.$controlIcon(_vm.display.prependOuterIcon),"append-icon":_vm.$controlIcon(_vm.display.appendIcon) || 'access_time',"append-outer-icon":_vm.$controlIcon(_vm.display.appendOuterIcon),"clearable":"","box":_vm.display.appearance === 'box',"solo":_vm.display.appearance === 'solo',"solo-inverted":_vm.display.appearance === 'solo-inverted',"outline":_vm.display.appearance === 'outline',"flat":!!_vm.display.flat,"required":_vm.config.required,"color":_vm.display.color || undefined},on:{"input":function($event){($event === null) && _vm.handleClear();}},slot:"activator",model:{value:(_vm.model[_vm.name]),callback:function ($$v) {_vm.$set(_vm.model, _vm.name, $$v);},expression:"model[name]"}}),_vm._v(" "),_c('v-time-picker',{attrs:{"min":_vm.config.minTime,"max":_vm.config.maxTime,"format":_vm.display.ampm ? 'ampm' : '24hr',"color":_vm.display.color || undefined,"landscape":_vm.landscape,"scrollable":""},model:{value:(_vm.timeModel),callback:function ($$v) {_vm.timeModel=$$v;},expression:"timeModel"}},[_c('v-spacer'),_vm._v(" "),_c('v-btn',{attrs:{"flat":"","icon":"","color":"red"},on:{"click":function($event){$event.stopPropagation();return _vm.onCancel()}}},[_c('v-icon',[_vm._v("clear")])],1),_vm._v(" "),_c('v-btn',{attrs:{"flat":"","icon":"","color":"green"},on:{"click":function($event){$event.stopPropagation();return _vm.onSave()}}},[_c('v-icon',[_vm._v("check")])],1)],1)],1)};
var __vue_staticRenderFns__$s = [];

  /* style */
  const __vue_inject_styles__$s = undefined;
  /* scoped */
  const __vue_scope_id__$s = undefined;
  /* module identifier */
  const __vue_module_identifier__$s = undefined;
  /* functional template */
  const __vue_is_functional_template__$s = false;
  /* style inject */
  
  /* style inject SSR */
  

  
  var TimeControl = normalizeComponent(
    { render: __vue_render__$s, staticRenderFns: __vue_staticRenderFns__$s },
    __vue_inject_styles__$s,
    __vue_script__$s,
    __vue_scope_id__$s,
    __vue_is_functional_template__$s,
    __vue_module_identifier__$s,
    undefined,
    undefined
  );

//

var script$t = {
    mixins: [jsonForm.JsonFormElementMixin],
    data()
    {
        return {
            timePick: false,
            showDialog: false,

            dateFormatted: null,
            dateModel: null,
            timeModel: '00:00'
        }
    },
    watch: {
        modelProxy(value)
        {
            if (!value) {
                this.dateFormatted = null;
                return;
            }
            [this.dateModel, this.timeModel] = value.split('T');
            this.dateFormatted = this.formatDate(this.dateModel) + ' ' + this.formatTime(this.timeModel);
        }
    },
    computed: {
        landscape()
        {
            if (!this.display.landscape) {
                return false;
            }
            return this.$vuetify.breakpoint.mdAndUp || false;
        },
        locale()
        {
            if (this.config.locale) {
                return this.config.locale;
            }
            return this.$intl.language || 'en';
        },
        firstDayOfWeek()
        {
            if (this.config.firstDayOfWeek) {
                return this.config.firstDayOfWeek;
            }
            return this.$intl.firstDayOfWeek || 0;
        },
        allowedDates()
        {
            const obj = {min: undefined, max: undefined};
            if (this.config.minDateTime) {
                obj.min = this.config.minDateTime.split('T')[0];
            }
            if (this.config.maxDateTime) {
                obj.max = this.config.maxDateTime.split('T')[0];
            }
            return obj;
        },
        allowedTimes()
        {
            const obj = {min: undefined, max: undefined};
            if (!this.dateModel) {
                return obj;
            }
            const selected = this.parseTime(this.timeModel);
            selected.d = this.dateModel;

            if (this.config.minDateTime) {
                const min = this.parseDateTime(this.config.minDateTime);
                if (selected.d === min.d) {
                    obj.min = min.t;
                }
            }

            if (this.config.maxDateTime) {
                const max = this.parseDateTime(this.config.maxDateTime);
                if (selected.d === max.d) {
                    obj.max = max.t;
                }
            }

            return obj;
        }
    },
    mounted()
    {
        let d = this.modelProxy;
        if (!d) {
            return;
        }
        d = new Date(d);
        if (isNaN(d.getTime())) {
            this.$delete(this.model, this.name);
            return;
        }
        [this.dateModel, d] = d.toISOString().split('T');
        this.timeModel = d.split(':').slice(0, 2).join(':');
        this.updateValue(false);
    },
    methods: {
        onSave()
        {
            this.showDialog = false;
            this.updateValue();
        },
        onCancel()
        {
            this.showDialog = false;
            if (this.modelProxy) {
                [this.dateModel, this.timeModel] = this.modelProxy.split('T');
            }
        },
        handleClear()
        {
            this.timePick = false;
            this.dateModel = null;
            this.timeModel = '00:00';
            this.$delete(this.model, this.name);
        },
        parseDateTime(date)
        {
            date = date.split('T');
            const t = date[1] || '00:00';
            let obj = this.parseTime(t);
            obj.t = t;
            obj.d = date[0];
            return obj;
        },
        parseTime(time)
        {
            time = time.split(':');
            time = {
                h: Number(time[0] || 0),
                m: Number(time[1] || 0),
            };
            return time;
        },
        updateValue(validate = true)
        {
            if (this.dateModel === null) {
                this.dateModel = (new Date()).toISOString().split('T')[0];
            }
            this.$set(this.model, this.name, this.dateModel + 'T' + this.timeModel);
            this.dateFormatted = this.formatDate(this.dateModel) + ' ' + this.formatTime(this.timeModel);
            validate && this.validate();
        },
        formatDate(date)
        {
            if (!date) {
                return null;
            }
            return (new Date(date)).toLocaleDateString(this.locale);
        },
        formatTime(time)
        {
            if (!time) {
                return '';
            }
            return time.toString();
        },
        showDate()
        {
            this.timePick = false;
            this.showDialog = true;
        },
        showTime()
        {
            this.timePick = true;
            this.showDialog = true;
        },
        onRouteLeave(func)
        {
            if (!this.showDialog) {
                return true;
            }
            this.onCancel();
            return false;
        }
    }
};

/* script */
const __vue_script__$t = script$t;

/* template */
var __vue_render__$t = function () {var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;return _c('v-dialog',{attrs:{"persistent":"","lazy":"","full-width":"","width":_vm.landscape ? 460 : 290},model:{value:(_vm.showDialog),callback:function ($$v) {_vm.showDialog=$$v;},expression:"showDialog"}},[_c('v-layout',{attrs:{"slot":"activator","row":""},slot:"activator"},[_c('v-text-field',{attrs:{"readonly":"","error-messages":_vm.allErrors,"label":_vm.$intl.translate(_vm.display.title),"suffix":_vm.$intl.translate(_vm.display.suffix),"prefix":_vm.$intl.translate(_vm.display.prefix),"prepend-inner-icon":_vm.$controlIcon(_vm.display.prependIcon) || 'event',"prepend-icon":_vm.$controlIcon(_vm.display.prependOuterIcon),"append-icon":_vm.$controlIcon(_vm.display.appendIcon) || 'access_time',"append-outer-icon":_vm.$controlIcon(_vm.display.appendOuterIcon),"clearable":"","color":_vm.display.color || undefined,"box":_vm.display.appearance === 'box',"solo":_vm.display.appearance === 'solo',"solo-inverted":_vm.display.appearance === 'solo-inverted',"outline":_vm.display.appearance === 'outline',"flat":!!_vm.display.flat,"required":_vm.config.required},on:{"input":function($event){($event === null) && _vm.handleClear();},"click:prepend-inner":function($event){return _vm.showDate()},"click:append":function($event){return _vm.showTime()}},model:{value:(_vm.dateFormatted),callback:function ($$v) {_vm.dateFormatted=$$v;},expression:"dateFormatted"}})],1),_vm._v(" "),_c('v-time-picker',{directives:[{name:"show",rawName:"v-show",value:(_vm.timePick),expression:"timePick"}],attrs:{"min":_vm.allowedTimes.min,"max":_vm.allowedTimes.max,"format":_vm.display.ampm ? 'ampm' : '24hr',"color":_vm.display.color || undefined,"landscape":_vm.landscape,"scrollable":""},model:{value:(_vm.timeModel),callback:function ($$v) {_vm.timeModel=$$v;},expression:"timeModel"}},[_c('v-btn',{attrs:{"icon":"","flat":""},on:{"click":function($event){_vm.timePick = false;}}},[_c('v-icon',[_vm._v("event")])],1),_vm._v(" "),_c('v-spacer'),_vm._v(" "),_c('v-btn',{attrs:{"flat":"","icon":"","color":"red"},on:{"click":function($event){$event.stopPropagation();return _vm.onCancel()}}},[_c('v-icon',[_vm._v("clear")])],1),_vm._v(" "),_c('v-btn',{attrs:{"flat":"","icon":"","color":"green"},on:{"click":function($event){$event.stopPropagation();return _vm.onSave()}}},[_c('v-icon',[_vm._v("check")])],1)],1),_vm._v(" "),_c('v-date-picker',{directives:[{name:"show",rawName:"v-show",value:(!_vm.timePick),expression:"!timePick"}],attrs:{"min":_vm.allowedDates.min,"max":_vm.allowedDates.max,"locale":_vm.locale,"first-day-of-week":_vm.firstDayOfWeek,"color":_vm.display.color || undefined,"landscape":_vm.landscape,"scrollable":""},model:{value:(_vm.dateModel),callback:function ($$v) {_vm.dateModel=$$v;},expression:"dateModel"}},[_c('v-btn',{attrs:{"icon":"","flat":""},on:{"click":function($event){_vm.timePick = true;}}},[_c('v-icon',[_vm._v("access_time")])],1),_vm._v(" "),_c('v-spacer'),_vm._v(" "),_c('v-btn',{attrs:{"flat":"","icon":"","color":"red"},on:{"click":function($event){$event.stopPropagation();return _vm.onCancel()}}},[_c('v-icon',[_vm._v("clear")])],1),_vm._v(" "),_c('v-btn',{attrs:{"flat":"","icon":"","color":"green"},on:{"click":function($event){$event.stopPropagation();return _vm.onSave()}}},[_c('v-icon',[_vm._v("check")])],1)],1)],1)};
var __vue_staticRenderFns__$t = [];

  /* style */
  const __vue_inject_styles__$t = undefined;
  /* scoped */
  const __vue_scope_id__$t = undefined;
  /* module identifier */
  const __vue_module_identifier__$t = undefined;
  /* functional template */
  const __vue_is_functional_template__$t = false;
  /* style inject */
  
  /* style inject SSR */
  

  
  var DateTimeControl = normalizeComponent(
    { render: __vue_render__$t, staticRenderFns: __vue_staticRenderFns__$t },
    __vue_inject_styles__$t,
    __vue_script__$t,
    __vue_scope_id__$t,
    __vue_is_functional_template__$t,
    __vue_module_identifier__$t,
    undefined,
    undefined
  );

//

var script$u = {
    mixins: [jsonForm.JsonFormElementMixin],
    components: {ControlLabel, ListError},
    data()
    {
        return {
            dragOptions: {
                handle: '.drag-handle'
            }
        };
    },
    computed: {
        canAddItem()
        {
            const max = this.config.maxItems;
            if (!max || max < 0) {
                return true;
            }

            const value = this.modelProxy;
            return !value || value.length < max;
        },
        validations()
        {
            const model = this.modelProxy;
            if (!model || model.length === 0) {
                return null;
            }
            const v = {};
            const length = model.length;
            const parser = this.wrapper.parser;
            const items = this.items;
            for (let i = 0; i < length; i++) {
                v[i] = {};
                parser.parseControlList(items, v[i]);
            }
            return v;
        }
    },
    methods: {
        itemTitle(val)
        {
            let title = this.display.itemTitle;
            if (typeof title === "function") {
                title = title(val);
            }
            if (!title) {
                return null;
            }
            if (typeof title !== 'object') {
                title = {key: null, text: title};
            }
            return this.$intl.translate(title, val);
        },
        itemHasError(index, dirty = false)
        {
            const v = this.validatorProxy;
            if (!v || !v[index]) {
                return false;
            }

            if (!dirty && !v[index].$dirty) {
                return false;
            }

            return v[index].$invalid;
        },
        addItem()
        {
            this.wrapper.pushUnparsedForm({
                title: this.display.addTitle || {key: 'common.form.addItemTitle', text: 'Create new item'},
                button: this.display.addSubmitButtom || {key: 'common.form.addSubmitButton', text: 'Add'},
                model: {},
                items: this.items,
                actions: {
                    submit: (original, copy) => {
                        if (!Array.isArray(this.modelProxy)) {
                            this.$set(this.model, this.name, []);
                        }
                        this.modelProxy.push(copy);
                        this.validate();
                        return true;
                    }
                }
            });
        },
        removeItem(val)
        {
            let index = this.modelProxy.indexOf(val);
            if (index >= 0) {
                this.modelProxy.splice(index, 1);
                this.validate();
            }
        },
        editItem(val)
        {
            let index = this.modelProxy.indexOf(val);
            this.wrapper.pushUnparsedForm({
                title: this.display.editTitle || {key: 'common.form.editItemTitle', text: 'Edit item'},
                button: this.display.editSubmitButtom || {key: 'common.form.editSubmitButton', text: 'Save changes'},
                model: this.$clone(val),
                items: this.items,
                actions: {
                    submit: (original, copy) => {
                        this.$set(this.modelProxy, index, copy);
                        this.validate();
                        return true;
                    }
                }
            });
        }
    }
};

/* script */
const __vue_script__$u = script$u;

/* template */
var __vue_render__$u = function () {var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;return _c('v-list',{attrs:{"subheader":"","dense":""}},[_c('v-subheader',[_c('control-label',{attrs:{"text":_vm.$intl.translate(_vm.display.title),"has-error":_vm.allErrors.length > 0,"required":_vm.config.required}}),_vm._v(" "),_c('v-spacer'),_vm._v(" "),_c('v-btn',{attrs:{"disabled":!_vm.canAddItem,"small":"","flat":"","ripple":""},on:{"click":function($event){$event.stopPropagation();return _vm.addItem()}}},[_c('v-icon',[_vm._v("add")]),_vm._v("\n            "+_vm._s(_vm.$intl.translate(_vm.display.addButton || {key: 'common.form.add', text: 'Add'}))+"\n        ")],1)],1),_vm._v(" "),_c('draggable',_vm._b({attrs:{"list":_vm.modelProxy}},'draggable',_vm.dragOptions,false),[_vm._l((_vm.modelProxy),function(val,index){return _c('v-list-tile',{key:_vm.$uniqueObjectId(val, index),on:{"click":function($event){return _vm.editItem(val)}}},[_c('v-list-tile-avatar',{staticClass:"drag-handle"},[(_vm.itemHasError(index))?_c('v-icon',{attrs:{"color":"red"}},[_vm._v("error")]):_c('v-icon',[_vm._v("swap_vert")]),_vm._v("\n                "+_vm._s(index + 1)+".\n            ")],1),_vm._v(" "),_c('v-list-tile-content',[_c('v-list-tile-title',[_vm._v(_vm._s(_vm.itemTitle(val)))])],1),_vm._v(" "),_c('v-list-tile-action',[_c('v-btn',{attrs:{"icon":"","ripple":""},on:{"click":function($event){$event.stopPropagation();return _vm.removeItem(val)}}},[_c('v-icon',{attrs:{"color":"red"}},[_vm._v("delete")])],1)],1)],1)}),_vm._v(" "),_c('v-list-tile',{directives:[{name:"show",rawName:"v-show",value:(!_vm.modelProxy || _vm.modelProxy.length === 0),expression:"!modelProxy || modelProxy.length === 0"}],staticClass:"sortable-empty-list-item"},[_c('v-list-tile-content',[_vm._v("\n                "+_vm._s(_vm.$intl.translate(_vm.display.placeholder || {key: 'common.form.empty_list', text: 'No items'}))+"\n            ")])],1)],2),_vm._v(" "),(_vm.allErrors.length > 0)?[_c('v-divider'),_vm._v(" "),_c('list-error',{attrs:{"error":_vm.allErrors[0]}})]:_vm._e()],2)};
var __vue_staticRenderFns__$u = [];

  /* style */
  const __vue_inject_styles__$u = undefined;
  /* scoped */
  const __vue_scope_id__$u = undefined;
  /* module identifier */
  const __vue_module_identifier__$u = undefined;
  /* functional template */
  const __vue_is_functional_template__$u = false;
  /* style inject */
  
  /* style inject SSR */
  

  
  var RepeatControl = normalizeComponent(
    { render: __vue_render__$u, staticRenderFns: __vue_staticRenderFns__$u },
    __vue_inject_styles__$u,
    __vue_script__$u,
    __vue_scope_id__$u,
    __vue_is_functional_template__$u,
    __vue_module_identifier__$u,
    undefined,
    undefined
  );

//

var script$v = {
    mixins: [jsonForm.JsonFormElementMixin],
    components: {ControlLabel, ListError},
    data()
    {
        return {
            dragOptions: {
                handle: '.drag-handle'
            }
        };
    },
    computed: {
        variantValidations()
        {
            const model = this.modelProxy;
            if (!Array.isArray(model) || model.length === 0) {
                return null;
            }

            const v = {};
            const p = this.config.variantField;
            const parser = this.wrapper.parser;
            model.map((item, index) => {
                v[index] = {};
                parser.parseControlList(this.getVariantByName(item[p]).items, v[index]);
            });

            return v;
        },
        canAddItem()
        {
            const max = this.config.maxItems;
            if (!max || max < 0) {
                return true;
            }

            const value = this.modelProxy;
            return !value || value.length < max;
        }
    },
    methods: {
        variantTitle(variant)
        {
            if (variant.display && variant.display.title) {
                return variant.display.title;
            }
            return variant.title;
        },
        itemTitle(val)
        {
            const v = this.getVariantByName(val[this.config.variantField]);
            let title = v.itemTitle || this.display.itemTitle;
            if (typeof title === "function") {
                title = title(val);
            }
            if (!title) {
                return null;
            }
            if (typeof title !== 'object') {
                title = {key: null, text: title};
            }
            return this.$intl.translate(title, val);
        },
        itemHasError(index, dirty = false)
        {
            const v = this.validatorProxy;
            if (!v || !v[index] || (!dirty && !v[index].$dirty)) {
                return false;
            }

            return v[index].$invalid;
        },
        getVariantByName(name)
        {
            for (let i = 0, m = this.items.length; i < m; i++) {
                if (this.items[i].name === name) {
                    return this.items[i];
                }
            }
            return null;
        },
        addItem(variant)
        {
            this.wrapper.pushUnparsedForm({
                title: this.display.addTitle || {key: 'common.form.addItemTitle', text: 'Create new item'},
                button: this.display.addSubmitButtom || {key: 'common.form.addSubmitButton', text: 'Add'},
                model: {
                    [this.config.variantField]: variant.name
                },
                items: variant.items,
                actions: {
                    submit: (original, copy) => {
                        this.modelProxy.push(copy);
                        this.validate();
                        return true;
                    }
                }
            });
        },
        removeItem(val)
        {
            let index = this.modelProxy.indexOf(val);
            if (index >= 0) {
                this.modelProxy.splice(index, 1);
                this.validate();
            }
        },
        editItem(val)
        {
            let index = this.modelProxy.indexOf(val);
            const variant = this.getVariantByName(val[this.config.variantField]);
            this.wrapper.pushUnparsedForm({
                title: this.display.editTitle || {key: 'common.form.editItemTitle', text: 'Edit item'},
                button: this.display.editSubmitButtom || {key: 'common.form.editSubmitButton', text: 'Save changes'},
                model: this.$clone(val),
                items: variant.items,
                actions: {
                    submit: (original, copy) => {
                        this.$set(this.modelProxy, index, copy);
                        this.validate();
                        return true;
                    }
                }
            });
        }
    }
};

/* script */
const __vue_script__$v = script$v;

/* template */
var __vue_render__$v = function () {var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;return _c('v-list',{attrs:{"subheader":"","dense":""}},[_c('v-subheader',[_c('control-label',{attrs:{"text":_vm.$intl.translate(_vm.display.title),"has-error":_vm.allErrors.length > 0,"required":_vm.config.required}}),_vm._v(" "),_c('v-spacer'),_vm._v(" "),_c('v-menu',{attrs:{"offset-y":"","bottom":"","disabled":!_vm.canAddItem,"max-height":"426"}},[_c('v-btn',{attrs:{"slot":"activator","disabled":!_vm.canAddItem,"small":"","flat":"","ripple":""},slot:"activator"},[_c('v-icon',[_vm._v("add")]),_vm._v("\n                "+_vm._s(_vm.$intl.translate(_vm.display.addButton || {key: 'common.form.add', text: 'Add'}))+"\n            ")],1),_vm._v(" "),_c('v-list',_vm._l((_vm.items),function(variant){return _c('v-list-tile',{key:variant.name,on:{"click":function($event){return _vm.addItem(variant)}}},[_c('v-list-tile-title',[_vm._v(_vm._s(_vm.$intl.translate(_vm.variantTitle(variant))))])],1)}),1)],1)],1),_vm._v(" "),_c('draggable',_vm._b({attrs:{"list":_vm.modelProxy}},'draggable',_vm.dragOptions,false),[_vm._l((_vm.modelProxy),function(val,index){return _c('v-list-tile',{key:_vm.$uniqueObjectId(val, index),on:{"click":function($event){return _vm.editItem(val)}}},[_c('v-list-tile-avatar',{staticClass:"drag-handle"},[(_vm.itemHasError(index))?_c('v-icon',{attrs:{"color":"red"}},[_vm._v("error")]):_c('v-icon',[_vm._v("swap_vert")]),_vm._v("\n                "+_vm._s(index + 1)+".\n            ")],1),_vm._v(" "),_c('v-list-tile-content',[_c('v-list-tile-title',[_vm._v(_vm._s(_vm.itemTitle(val)))]),_vm._v(" "),_c('v-list-tile-sub-title',[_vm._v(_vm._s(_vm.$intl.translate(_vm.variantTitle(_vm.getVariantByName(val[_vm.config.variantField]))))+"\n                ")])],1),_vm._v(" "),_c('v-list-tile-action',[_c('v-btn',{attrs:{"icon":"","ripple":""},on:{"click":function($event){$event.stopPropagation();return _vm.removeItem(val)}}},[_c('v-icon',{attrs:{"color":"red"}},[_vm._v("delete")])],1)],1)],1)}),_vm._v(" "),_c('v-list-tile',{directives:[{name:"show",rawName:"v-show",value:(_vm.modelProxy.length === 0),expression:"modelProxy.length === 0"}],staticClass:"sortable-empty-list-item"},[_c('v-list-tile-content',[_vm._v("\n                "+_vm._s(_vm.$intl.translate(_vm.display.placeholder || {key: 'common.form.empty_list', text: 'No items'}))+"\n            ")])],1)],2),_vm._v(" "),(_vm.allErrors.length > 0)?[_c('v-divider'),_vm._v(" "),_c('list-error',{attrs:{"error":_vm.allErrors[0]}})]:_vm._e()],2)};
var __vue_staticRenderFns__$v = [];

  /* style */
  const __vue_inject_styles__$v = undefined;
  /* scoped */
  const __vue_scope_id__$v = undefined;
  /* module identifier */
  const __vue_module_identifier__$v = undefined;
  /* functional template */
  const __vue_is_functional_template__$v = false;
  /* style inject */
  
  /* style inject SSR */
  

  
  var RepeatVariantsControl = normalizeComponent(
    { render: __vue_render__$v, staticRenderFns: __vue_staticRenderFns__$v },
    __vue_inject_styles__$v,
    __vue_script__$v,
    __vue_scope_id__$v,
    __vue_is_functional_template__$v,
    __vue_module_identifier__$v,
    undefined,
    undefined
  );

//

var script$w = {
    mixins: [jsonForm.JsonFormElementMixin],
    components: {ControlLabel, ListError},
    data()
    {
        return {
            dragOptions: {
                draggable: '.drag-item',
                filter: '.drag-ignore',
                handle: '.drag-handle',
                group: 'region-' + this.$uniqueObjectId(this)
            }
        };
    },
    computed: {
        validations()
        {
            const model = this.modelProxy;
            if (!model || model.length === 0) {
                return null;
            }

            const v = {};
            const p = this.config.variantField;

            const items = this.items;
            const parser = this.wrapper.parser;
            this.config.regions.map(region => {
                v[region.name] = region.validation ? parser.validator.getMultiple(region.validation) : {};

                if (!Array.isArray(model[region.name])) {
                    return;
                }

                model[region.name].map((item, index) => {
                    v[region.name][index] = {};
                    parser.parseControlList(items, v[region.name][index]);
                });
            });

            return v;
        },
        translatedTitle()
        {
            if (!this.display.title) {
                return null;
            }
            return this.$intl.translate(this.display.title) || null;
        }
    },
    methods: {
        itemTitle(val)
        {
            let title = this.display.itemTitle;
            if (typeof title === "function") {
                title = title(val);
            }
            if (!title) {
                return null;
            }
            if (typeof title !== 'object') {
                title = {key: null, text: title};
            }
            return this.$intl.translate(title, val);
        },
        itemHasError(region, index, dirty = false)
        {
            const v = this.validatorProxy;
            if (!v || !v[region.name]) {
                return false;
            }

            if (!v[region.name].$invalid || !v[region.name][index]) {
                return false;
            }

            if (!dirty && !v[region.name][index].$dirty) {
                return false;
            }

            return v[region.name][index].$invalid;
        },
        canAddItem(region)
        {
            const max = region.config.maxItems;
            if (!max || max < 0) {
                return true;
            }

            const model = this.modelProxy;
            if (!model[region.name]) {
                return true;
            }

            return model[region.name].length < max;
        },
        addItem(region)
        {
            this.wrapper.pushUnparsedForm({
                title: this.display.addTitle || {key: 'common.form.addItemTitle', text: 'Create new item'},
                button: this.display.addSubmitButtom || {key: 'common.form.addSubmitButton', text: 'Add'},
                model: {},
                items: this.items,
                actions: {
                    submit: (original, copy) => {
                        this.modelProxy[region.name].push(copy);
                        this.validate();
                        return true;
                    }
                }
            });
        },
        removeItem(region, val)
        {
            let index = this.modelProxy[region.name].indexOf(val);
            if (index >= 0) {
                this.modelProxy[region.name].splice(index, 1);
                this.validate();
            }
        },
        editItem(region, val)
        {
            let index = this.modelProxy[region.name].indexOf(val);
            this.wrapper.pushUnparsedForm({
                title: this.display.editTitle || {key: 'common.form.editItemTitle', text: 'Edit item'},
                button: this.display.editSubmitButtom || {key: 'common.form.editSubmitButton', text: 'Save changes'},
                model: this.$clone(val),
                items: this.items,
                actions: {
                    submit: (original, copy) => {
                        this.$set(this.modelProxy[region.name], index, copy);
                        this.validate();
                        return true;
                    }
                }
            });
        }
    },
    created()
    {
        this.config.regions.map(item => {
            if (!this.modelProxy.hasOwnProperty(item.name)) {
                this.$set(this.modelProxy, item.name, []);
            }
        });
    },
    beforeDestroy()
    {
        this.config.regions.map(item => {
            this.$delete(this.modelProxy, item.name);
        });
    }
};

/* script */
const __vue_script__$w = script$w;

/* template */
var __vue_render__$w = function () {var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;return _c('div',[(Boolean(_vm.translatedTitle))?_c('v-subheader',[_c('control-label',{attrs:{"text":_vm.$intl.translate(_vm.display.title),"has-error":_vm.allErrors.length > 0,"required":_vm.config.required}})],1):_vm._e(),_vm._v(" "),_vm._l((_vm.config.regions),function(region){return _c('v-list',{key:region.name,attrs:{"subheader":"","dense":""}},[_c('v-subheader',[_c('control-label',{attrs:{"text":_vm.$intl.translate(region.title),"has-error":_vm.hasErrors(region.name),"required":region.config.required}}),_vm._v(" "),_c('v-spacer'),_vm._v(" "),_c('v-btn',{attrs:{"disabled":!_vm.canAddItem(region),"small":"","flat":"","ripple":""},on:{"click":function($event){$event.stopPropagation();return _vm.addItem(region)}}},[_c('v-icon',[_vm._v("add")]),_vm._v("\n                "+_vm._s(_vm.$intl.translate(_vm.display.addButton || {key: 'common.form.add', text: 'Add'}))+"\n            ")],1)],1),_vm._v(" "),_c('draggable',_vm._b({staticStyle:{"min-height":"2px"},attrs:{"list":_vm.modelProxy[region.name]}},'draggable',_vm.dragOptions,false),_vm._l((_vm.modelProxy[region.name]),function(val,index){return _c('v-list-tile',{key:_vm.$uniqueObjectId(val, index),staticClass:"drag-item",on:{"click":function($event){return _vm.editItem(region, val)}}},[_c('v-list-tile-avatar',{staticClass:"drag-handle"},[(_vm.itemHasError(region, index))?_c('v-icon',{attrs:{"color":"red"}},[_vm._v("error")]):_c('v-icon',[_vm._v("swap_vert")]),_vm._v("\n                    "+_vm._s(index + 1)+".\n                ")],1),_vm._v(" "),_c('v-list-tile-content',[_c('v-list-tile-title',[_vm._v(_vm._s(_vm.itemTitle(val)))])],1),_vm._v(" "),_c('v-list-tile-action',[_c('v-btn',{attrs:{"icon":"","ripple":""},on:{"click":function($event){$event.stopPropagation();return _vm.removeItem(region, val)}}},[_c('v-icon',{attrs:{"color":"red"}},[_vm._v("delete")])],1)],1)],1)}),1),_vm._v(" "),_c('v-list-tile',{directives:[{name:"show",rawName:"v-show",value:(_vm.modelProxy[region.name].length === 0),expression:"modelProxy[region.name].length === 0"}],staticClass:"sortable-empty-list-item"},[_c('v-list-tile-content',[_vm._v("\n                "+_vm._s(_vm.$intl.translate(_vm.display.placeholder || {key: 'common.form.empty_list', text: 'No items'}))+"\n            ")])],1),_vm._v(" "),(_vm.hasErrors(region.name))?[_c('v-divider'),_vm._v(" "),_c('list-error',{attrs:{"error":_vm.getAllErrors(region.name)[0]}})]:_vm._e()],2)})],2)};
var __vue_staticRenderFns__$w = [];

  /* style */
  const __vue_inject_styles__$w = undefined;
  /* scoped */
  const __vue_scope_id__$w = undefined;
  /* module identifier */
  const __vue_module_identifier__$w = undefined;
  /* functional template */
  const __vue_is_functional_template__$w = false;
  /* style inject */
  
  /* style inject SSR */
  

  
  var GroupRepeatControl = normalizeComponent(
    { render: __vue_render__$w, staticRenderFns: __vue_staticRenderFns__$w },
    __vue_inject_styles__$w,
    __vue_script__$w,
    __vue_scope_id__$w,
    __vue_is_functional_template__$w,
    __vue_module_identifier__$w,
    undefined,
    undefined
  );

//

var script$x = {
    mixins: [jsonForm.JsonFormElementMixin],
    components: {ControlLabel, ListError},
    data()
    {
        return {
            dragOptions: {
                draggable: '.drag-item',
                filter: '.drag-ignore',
                handle: '.drag-handle',
                group: 'region-' + this.$uniqueObjectId(this)
            }
        };
    },
    computed: {
        regionVariantValidations()
        {
            const model = this.modelProxy;
            if (!model || model.length === 0) {
                return null;
            }

            const v = {};
            const p = this.config.variantField;

            const parser = this.wrapper.parser;
            this.config.regions.map(region => {
                v[region.name] = region.validation ? parser.validator.getMultiple(region.validation) : {};

                if (!Array.isArray(model[region.name])) {
                    return;
                }

                model[region.name].map((item, index) => {
                    v[region.name][index] = {};
                    parser.parseControlList(this.getVariantByName(item[p]).items, v[region.name][index]);
                });
            });

            return v;
        },
        translatedTitle()
        {
            if (!this.display.title) {
                return null;
            }
            return this.$intl.translate(this.display.title) || null;
        }
    },
    methods: {
        variantTitle(variant)
        {
            if (variant.display && variant.display.title) {
                return variant.display.title;
            }
            return variant.title;
        },
        itemTitle(val)
        {
            const v = this.getVariantByName(val[this.config.variantField]);
            let title = v.itemTitle || this.display.itemTitle;
            if (typeof title === "function") {
                title = title(val);
            }
            if (!title) {
                return null;
            }
            if (typeof title !== 'object') {
                title = {key: null, text: title};
            }
            return this.$intl.translate(title, val);
        },
        canAddItem(region)
        {
            const max = region.config.maxItems;
            if (!max || max < 0) {
                return true;
            }

            const value = this.modelProxy[region.name];
            return !value || value.length < max;
        },
        itemHasError(region, index, dirty = false)
        {
            const v = this.validatorProxy;
            if (!v || !v[region.name] || !v[region.name][index]) {
                return false;
            }

            if (!dirty && !v[region.name][index].$dirty) {
                return false;
            }

            return v[region.name][index].$invalid;
        },
        getVariantByName(name)
        {
            for (let i = 0, m = this.items.length; i < m; i++) {
                if (this.items[i].name === name) {
                    return this.items[i];
                }
            }
            return null;
        },
        addItem(region, variant)
        {
            this.wrapper.pushUnparsedForm({
                title: this.display.addTitle || {key: 'common.form.addItemTitle', text: 'Create new item'},
                button: this.display.addSubmitButtom || {key: 'common.form.addSubmitButton', text: 'Add'},
                model: {
                    [this.config.variantField]: variant.name
                },
                items: variant.items,
                actions: {
                    submit: (original, copy) => {
                        this.modelProxy[region.name].push(copy);
                        this.validate();
                        return true;
                    }
                }
            });
        },
        removeItem(region, val)
        {
            let index = this.modelProxy[region.name].indexOf(val);
            if (index >= 0) {
                this.modelProxy[region.name].splice(index, 1);
                this.validate();
            }
        },
        editItem(region, val)
        {
            let index = this.modelProxy[region.name].indexOf(val);
            const variant = this.getVariantByName(val[this.config.variantField]);
            this.wrapper.pushUnparsedForm({
                title: this.display.editTitle || {key: 'common.form.editItemTitle', text: 'Edit item'},
                button: this.display.editSubmitButtom || {key: 'common.form.editSubmitButton', text: 'Save changes'},
                model: this.$clone(val),
                items: variant.items,
                actions: {
                    submit: (original, copy) => {
                        this.$set(this.modelProxy[region.name], index, copy);
                        this.validate();
                        return true;
                    }
                }
            });
        }
    },
    created()
    {
        this.config.regions.map(item => {
            if (!this.modelProxy.hasOwnProperty(item.name)) {
                this.$set(this.modelProxy, item.name, []);
            }
        });
    },
    beforeDestroy()
    {
        this.config.regions.map(item => {
            this.$delete(this.modelProxy, item.name);
        });
    }
};

/* script */
const __vue_script__$x = script$x;

/* template */
var __vue_render__$x = function () {var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;return _c('div',[(Boolean(_vm.translatedTitle))?_c('v-subheader',[_c('control-label',{attrs:{"text":_vm.translatedTitle,"has-error":_vm.allErrors.length > 0,"required":_vm.config.required}})],1):_vm._e(),_vm._v(" "),_vm._l((_vm.config.regions),function(region){return _c('v-list',{key:region.name,attrs:{"subheader":"","dense":""}},[_c('v-subheader',[_c('control-label',{attrs:{"text":_vm.$intl.translate(region.title),"has-error":_vm.hasErrors(region.name),"required":region.config.required}}),_vm._v(" "),_c('v-spacer'),_vm._v(" "),_c('v-menu',{attrs:{"offset-y":"","bottom":"","disabled":!_vm.canAddItem(region),"max-height":"426"}},[_c('v-btn',{attrs:{"slot":"activator","disabled":!_vm.canAddItem(region),"small":"","flat":"","ripple":""},slot:"activator"},[_c('v-icon',[_vm._v("add")]),_vm._v("\n                    "+_vm._s(_vm.$intl.translate(_vm.display.addButton || {key: 'common.form.add', text: 'Add'}))+"\n                ")],1),_vm._v(" "),_c('v-list',_vm._l((_vm.items),function(variant){return _c('v-list-tile',{key:variant.name,on:{"click":function($event){return _vm.addItem(region, variant)}}},[_c('v-list-tile-title',[_vm._v(_vm._s(_vm.$intl.translate(_vm.variantTitle(variant))))])],1)}),1)],1)],1),_vm._v(" "),_c('draggable',_vm._b({staticStyle:{"min-height":"2px"},attrs:{"list":_vm.modelProxy[region.name]}},'draggable',_vm.dragOptions,false),_vm._l((_vm.modelProxy[region.name]),function(val,index){return _c('v-list-tile',{key:_vm.$uniqueObjectId(val, index),staticClass:"drag-item",on:{"click":function($event){return _vm.editItem(region, val)}}},[_c('v-list-tile-avatar',{staticClass:"drag-handle"},[(_vm.itemHasError(region, index))?_c('v-icon',{attrs:{"color":"red"}},[_vm._v("error")]):_c('v-icon',[_vm._v("swap_vert")]),_vm._v("\n                    "+_vm._s(index + 1)+".\n                ")],1),_vm._v(" "),_c('v-list-tile-content',[_c('v-list-tile-title',[_vm._v(_vm._s(_vm.itemTitle(val)))]),_vm._v(" "),_c('v-list-tile-sub-title',[_vm._v("\n                        "+_vm._s(_vm.$intl.translate(_vm.variantTitle(_vm.getVariantByName(val[_vm.config.variantField]))))+"\n                    ")])],1),_vm._v(" "),_c('v-list-tile-action',[_c('v-btn',{attrs:{"icon":"","ripple":""},on:{"click":function($event){$event.stopPropagation();return _vm.removeItem(region, val)}}},[_c('v-icon',{attrs:{"color":"red"}},[_vm._v("delete")])],1)],1)],1)}),1),_vm._v(" "),_c('v-list-tile',{directives:[{name:"show",rawName:"v-show",value:(_vm.modelProxy[region.name].length === 0),expression:"modelProxy[region.name].length === 0"}],staticClass:"sortable-empty-list-item"},[_c('v-list-tile-content',[_vm._v("\n                "+_vm._s(_vm.$intl.translate(_vm.display.placeholder || {key: 'common.form.empty_list', text: 'No items'}))+"\n            ")])],1),_vm._v(" "),(_vm.hasErrors(region.name))?[_c('v-divider'),_vm._v(" "),_c('list-error',{attrs:{"error":_vm.getAllErrors(region.name)[0]}})]:_vm._e()],2)})],2)};
var __vue_staticRenderFns__$x = [];

  /* style */
  const __vue_inject_styles__$x = undefined;
  /* scoped */
  const __vue_scope_id__$x = undefined;
  /* module identifier */
  const __vue_module_identifier__$x = undefined;
  /* functional template */
  const __vue_is_functional_template__$x = false;
  /* style inject */
  
  /* style inject SSR */
  

  
  var GroupRepeatVariantsControl = normalizeComponent(
    { render: __vue_render__$x, staticRenderFns: __vue_staticRenderFns__$x },
    __vue_inject_styles__$x,
    __vue_script__$x,
    __vue_scope_id__$x,
    __vue_is_functional_template__$x,
    __vue_module_identifier__$x,
    undefined,
    undefined
  );

//

var script$y = {
    components: {JsonFormGroup: jsonForm.JsonFormGroup},
    mixins: [jsonForm.JsonFormElementMixin],
    watch: {
        currentVariant(variant)
        {
            const v = this.validatorProxy;
            if (v && v[this.variantProp]) {
                v[this.variantProp].$touch();
            }
            this.buildItems(variant);
        }
    },
    data()
    {
        return {
            loading: false,
            selectItems: this.items,
            currentItems: null,
            currentValidations: {},
        };
    },
    created()
    {
        const init = () => {
            const model = this.modelProxy;
            if (model && model[this.variantProp] != null) {
                this.buildItems(model[this.variantProp]);
            }
        };
        if (typeof this.config.variantLoader === 'function') {
            this.loading = true;
            this.config.variantLoader(this)
                .then(items => {
                    this.selectItems = items || [];
                    init();
                    this.loading = false;
                });
        } else {
            init();
        }
    },
    computed: {
        currentVariantValidations()
        {
            return this.currentValidations;
        },
        allErrors()
        {
            return this.getAllErrors(this.variantProp);
        },
        currentVariant()
        {
            return this.modelProxy[this.variantProp] || null;
        },
        variantProp()
        {
            return this.config.variantField || 'variant_name';
        }
    },
    methods: {
        getVariantByName(name)
        {
            if (name === null) {
                return null;
            }
            return this.selectItems.find(item => item.name === name);
        },
        clearObject(obj)
        {
            for (let prop in obj) {
                if (obj.hasOwnProperty(prop)) {
                    this.$delete(obj, prop);
                }
            }
            return obj;
        },
        buildItems(name)
        {
            if (name === null) {
                this.currentItems = null;
                this.clearObject(this.currentValidations);
                return;
            }

            const variant = this.getVariantByName(name);

            this.currentValidations = this.clearObject(this.currentValidations);

            const validations = {};
            this.currentItems = this.wrapper.parser.parseControlList(variant.items, validations);

            for (let prop in validations) {
                if (validations.hasOwnProperty(prop)) {
                    this.$set(this.currentValidations, prop, validations[prop]);
                }
            }
        },
        onRouteLeave(func)
        {
            if (this.currentItems === null) {
                return true;
            }
            return func(this.$refs.formGroup);
        }
    },
    beforeDestroy()
    {
        this.$delete(this.modelProxy, this.variantProp);
        this.currentItems = null;
        this.clearObject(this.currentValidations);
    }
};

/* script */
const __vue_script__$y = script$y;

/* template */
var __vue_render__$y = function () {var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;return _c('div',[_c('v-select',{attrs:{"error-messages":_vm.getAllErrors(_vm.variantProp),"label":_vm.$intl.translate(_vm.display.title),"hint":_vm.$intl.translate(_vm.display.hint),"placeholder":_vm.$intl.translate(_vm.display.placeholder),"prepend-inner-icon":_vm.$controlIcon(_vm.display.prependIcon),"prepend-icon":_vm.$controlIcon(_vm.display.prependOuterIcon),"append-icon":_vm.$controlIcon(_vm.display.appendIcon),"append-outer-icon":_vm.$controlIcon(_vm.display.appendOuterIcon),"color":_vm.display.color || undefined,"required":_vm.config.required,"clearable":"","box":_vm.display.appearance === 'box',"solo":_vm.display.appearance === 'solo',"solo-inverted":_vm.display.appearance === 'solo-inverted',"outline":_vm.display.appearance === 'outline',"flat":!!_vm.display.flat,"items":_vm.selectItems,"item-text":"title","item-value":"name","item-avatar":"icon","loading":_vm.loading,"disabled":_vm.loading},model:{value:(_vm.modelProxy[_vm.variantProp]),callback:function ($$v) {_vm.$set(_vm.modelProxy, _vm.variantProp, $$v);},expression:"modelProxy[variantProp]"}}),_vm._v(" "),(_vm.currentItems !== null)?_c('json-form-group',{ref:"formGroup",attrs:{"model":_vm.modelProxy,"validator":_vm.validatorProxy,"items":_vm.currentItems,"wrapper":_vm.wrapper,"path":_vm.path,"parent-validations-container":_vm.parentValidationsContainer,"validations-container":_vm.validationsContainer}}):_vm._e()],1)};
var __vue_staticRenderFns__$y = [];

  /* style */
  const __vue_inject_styles__$y = undefined;
  /* scoped */
  const __vue_scope_id__$y = undefined;
  /* module identifier */
  const __vue_module_identifier__$y = undefined;
  /* functional template */
  const __vue_is_functional_template__$y = false;
  /* style inject */
  
  /* style inject SSR */
  

  
  var VariantControl = normalizeComponent(
    { render: __vue_render__$y, staticRenderFns: __vue_staticRenderFns__$y },
    __vue_inject_styles__$y,
    __vue_script__$y,
    __vue_scope_id__$y,
    __vue_is_functional_template__$y,
    __vue_module_identifier__$y,
    undefined,
    undefined
  );

var controls = {
    'text': new jsonForm.StringControlParser(TextControl),
    'textarea': new jsonForm.StringControlParser(TextareaControl),
    'tel': new jsonForm.ExtendedStringControlParser(TelControl, {tel: true}),
    'email': new jsonForm.ExtendedStringControlParser(EmailControl, {email: true}),
    'password': new jsonForm.StringControlParser(PasswordControl),
    'number': new jsonForm.NumberControlParser(NumberControl),
    'url': new jsonForm.ExtendedStringControlParser(UrlControl, {url: true}),
    'ipv4': new jsonForm.ExtendedStringControlParser(TextControl, {ipv4: true}),
    'ipv6': new jsonForm.ExtendedStringControlParser(TextControl, {ipv6: true}),
    'color': new jsonForm.ExtendedStringControlParser(ColorControl, {color: true}),
    'hidden': new HiddenParser(HiddenControl),
    'uuid': new jsonForm.StringControlParser(UUIDControl),

    'checkbox': new jsonForm.BooleanControlParser(CheckboxControl),
    'checkbox-multi': new CheckboxMultiParser(CheckboxMultiControl),

    'switch': new jsonForm.BooleanControlParser(SwitchControl),
    'radio': new jsonForm.SelectionControlParser(RadioControl),
    'select': new SelectParser(SelectControl),
    'select-group': new SelectParser(SelectControl, true),
    'combobox': new ComboboxParser(ComboboxControl),
    'chips': new ChipsParser(ComboboxControl),
    'display': new DisplayParser(SelectControl),

    'slider': new jsonForm.NumberControlParser(SliderControl),
    'range': new RangeParser(RangeControl),

    'file': new jsonForm.FileControlParser(FileControl),

    'icon': new IconParser(IconControl),

    'description': new DescriptionParser(DescriptionControl),
    'col': new jsonForm.ObjectControlParser(ColControl),
    'row': new jsonForm.ObjectControlParser(RowControl),
    'group': new jsonForm.ObjectControlParser(GroupControl),
    'switch-group': new SwitchGroupParser(SwitchGroupControl),
    'async-group': new jsonForm.AsyncObjectControlParser(AsyncGroupControl),
    'tabs': new TabsParser(TabsControl),
    'component': new ComponentParser(ComponentControl),

    'date': new jsonForm.DateControlParser(DateControl),
    'time': new jsonForm.TimeControlParser(TimeControl),
    'date-time': new jsonForm.DateTimeControlParser(DateTimeControl),

    'repeat': new RepeatParser(RepeatControl),
    'repeat-variants': new RepeatVariantsParser(RepeatVariantsControl),
    'group-repeat': new GroupRepeatParser(GroupRepeatControl),
    'group-repeat-variants': new GroupRepeatVariantsParser(GroupRepeatVariantsControl),
    'variant': new VariantParser(VariantControl),
};

// import {ValidatorItem} from "@aquarelle/json-form";

var validators = {};

function install(Vue) {
    Vue.use(jsonForm.JsonForm);

    // controls
    for (const name in controls) {
        if (controls.hasOwnProperty(name)) {
            jsonForm.JsonForm.addControl(name, controls[name]);
        }
    }
    // validators
    for (const name in validators) {
        if (validators.hasOwnProperty(name)) {
            jsonForm.JsonForm.validator.add(validators[name]);
        }
    }

    // control icon
    Vue.prototype.$controlIcon = function (icon) {
        if (typeof icon !== 'string') {
            return undefined;
        }
        if (icon.indexOf(':') === -1) {
            return icon;
        }
        icon = icon.split(':');
        return icon[0] + ' fa-' + icon[1];
    };
}

exports.AsyncGroupControl = AsyncGroupControl;
exports.BlockError = BlockError;
exports.BlockForm = BlockForm;
exports.CheckboxControl = CheckboxControl;
exports.CheckboxMultiControl = CheckboxMultiControl;
exports.CheckboxMultiParser = CheckboxMultiParser;
exports.ChipsParser = ChipsParser;
exports.ColControl = ColControl;
exports.ColorControl = ColorControl;
exports.ComboboxControl = ComboboxControl;
exports.ComboboxParser = ComboboxParser;
exports.ComponentControl = ComponentControl;
exports.ComponentParser = ComponentParser;
exports.ControlIcon = ControlIcon;
exports.ControlLabel = ControlLabel;
exports.DateControl = DateControl;
exports.DateTimeControl = DateTimeControl;
exports.DescriptionControl = DescriptionControl;
exports.DescriptionParser = DescriptionParser;
exports.DialogForms = DialogForms;
exports.DisplayParser = DisplayParser;
exports.EmailControl = EmailControl;
exports.FileControl = FileControl;
exports.GroupControl = GroupControl;
exports.GroupRepeatControl = GroupRepeatControl;
exports.GroupRepeatParser = GroupRepeatParser;
exports.GroupRepeatVariantsControl = GroupRepeatVariantsControl;
exports.GroupRepeatVariantsParser = GroupRepeatVariantsParser;
exports.HiddenControl = HiddenControl;
exports.HiddenParser = HiddenParser;
exports.IconControl = IconControl;
exports.IconParser = IconParser;
exports.ListError = ListError;
exports.NumberControl = NumberControl;
exports.PasswordControl = PasswordControl;
exports.RadioControl = RadioControl;
exports.RangeControl = RangeControl;
exports.RangeParser = RangeParser;
exports.RepeatControl = RepeatControl;
exports.RepeatParser = RepeatParser;
exports.RepeatVariantsControl = RepeatVariantsControl;
exports.RepeatVariantsParser = RepeatVariantsParser;
exports.RowControl = RowControl;
exports.SelectControl = SelectControl;
exports.SelectParser = SelectParser;
exports.SliderControl = SliderControl;
exports.StepperForm = StepperForm;
exports.SwitchControl = SwitchControl;
exports.SwitchGroupControl = SwitchGroupControl;
exports.SwitchGroupParser = SwitchGroupParser;
exports.TabsControl = TabsControl;
exports.TabsParser = TabsParser;
exports.TelControl = TelControl;
exports.TextControl = TextControl;
exports.TextareaControl = TextareaControl;
exports.TimeControl = TimeControl;
exports.UUIDControl = UUIDControl;
exports.UrlControl = UrlControl;
exports.VariantControl = VariantControl;
exports.VariantParser = VariantParser;
exports.install = install;

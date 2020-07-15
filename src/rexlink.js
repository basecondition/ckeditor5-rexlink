import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import ButtonView from '@ckeditor/ckeditor5-ui/src/button/buttonview';
import LinkUI from '@ckeditor/ckeditor5-link/src/linkui';
import Model from '@ckeditor/ckeditor5-ui/src/model';
import Collection from '@ckeditor/ckeditor5-utils/src/collection';
import {createDropdown, addListToDropdown} from '@ckeditor/ckeditor5-ui/src/dropdown/utils';

import internlinkIcon from 'ckeditor5-rexlink/theme/icons/internlink.svg';
import medialinkIcon from 'ckeditor5-rexlink/theme/icons/medialink.svg';
import redaxolinkIcon from 'ckeditor5-rexlink/theme/icons/redaxolink.svg';
import emailLinkIcon from 'ckeditor5-rexlink/theme/icons/emaillink.svg';
import phoneLinkIcon from 'ckeditor5-rexlink/theme/icons/phonelink.svg';
import yTableLinkIcon from 'ckeditor5-rexlink/theme/icons/ytablelink.svg';

// TODO data-link-category => 14, data-media-category => 1, data-media-type => 'jpg,png' -> options like mform custom link
// TODO open media link by media id
// TODO custom icon for ytable widget dropdown links

/**
 * @extends module:core/plugin~Plugin
 */
export default class Rexlink extends Plugin {
    /**
     * @inheritDoc
     */
    constructor(editor) {
        super(editor);
        editor.config.define('link.rexlink', ['internal', 'media', 'email', 'phone']);
    }

    /**
     * @inheritDoc
     */
    init() {
        const editor = this.editor;
        const rexlinkConfig = editor.config.get('link.rexlink');

        this.linkFormView = editor.plugins.get(LinkUI).formView;

        this.linkFormView.once('render', () => {
            // to use this in for each callback
            const that = this;

            // add single link widget button
            if (rexlinkConfig.length === 1) {
                rexlinkConfig.forEach(function (item) {
                    if (item === 'ytable') {
                        that.rexItemButton = that._createLinkDropDown(false);
                    } else {
                        that.rexItemButton = that._createLinkButton(item);
                    }
                    that.rexItemButton.render(); // Render button's tamplate.
                    that.linkFormView.registerChild(that.rexItemButton); // Register the button under the link form view, it will handle its destruction.
                    that.linkFormView.element.insertBefore(that.rexItemButton.element, that.linkFormView.saveButtonView.element); // Inject the element into DOM.
                });
            } else {
                // add redaxo link drop down
                that.rexDropDownButton = that._createLinkDropDown(true);
                that.rexDropDownButton.render();
                that.linkFormView.registerChild(that.rexDropDownButton);
                that.linkFormView.element.insertBefore(that.rexDropDownButton.element, that.linkFormView.saveButtonView.element);
            }
        });
    }

    _createLinkButton(param) {
        let button = new ButtonView(this.locale),
            object = getRexDefaults(param);

        button.set({
            label: object.title,
            icon: object.icon,
            withText: false,
            tooltip: true
        });

        // Probably this button should be also disabled when the link command is disabled.
        // Try setting editor.isReadOnly = true to see it in action.
        button.bind('isEnabled').to(this.editor.commands.get('link'));

        button.on('execute', () => {
            // Do something (like open the popup), then update the link URL field's value.
            _widgetExecute(this, param);
        });
    }

    _createLinkDropDown(rexlink) {
        const editor = this.editor;
        const dropdown = createDropdown(this.locale);
        let title = 'Redaxo yTable-Link-Widgets';

        if (rexlink === true) {
            title = 'Redaxo Link-Widgets';
            addListToDropdown(dropdown, _prepareRexDefaultLinkOptions(editor.config.get('link.rexlink')));
        }

        addListToDropdown(dropdown, _prepareRexyTableLinkOptions(editor.config.get('link.ytable')));

        // Create dropdown model.#cd
        dropdown.buttonView.set({
            label: title,
            icon: redaxolinkIcon,
            withText: false,
            tooltip: true
        });

        dropdown.extendTemplate({
            attributes: {
                class: [
                    'ck-redaxo-link-dropdown'
                ]
            }
        });

        // Probably this button should be also disabled when the link command is disabled.
        // Try setting editor.isReadOnly = true to see it in action.
        dropdown.bind('isEnabled').to(editor.commands.get('link'));

        dropdown.on('execute', evt => {
            _widgetExecute(this, evt.source.commandParam);
        });

        // Execute command when an item from the dropdown is selected.
        // this.listenTo(dropdown, 'execute', evt => {
            // console.log('listeneTo execute');
            // console.log(evt.source.commandName);
            // console.log(evt.source.commandParam);
        // });

        return dropdown;
    }
}

function _prepareRexDefaultLinkOptions(options) {
    const itemDefinitions = new Collection();

    if (options.length > 0) {
        options.forEach(function (item) {
            if (item !== 'ytable') {
                let object = getRexDefaults(item);

                const def = {
                    type: 'button',
                    model: new Model({
                        commandName: 'link',
                        commandParam: item,
                        icon: object.icon,
                        label: object.title,
                        class: 'ck-rex-link-option',
                        withText: true
                    })
                };

                itemDefinitions.add(def);
            }
        });
    }

    return itemDefinitions;
}

// @private
function _prepareRexyTableLinkOptions(options) {
    const itemDefinitions = new Collection();
    if (options.length > 0) {

        options.forEach(function (object) {
            const def = {
                type: 'button',
                model: new Model({
                    commandName: 'link',
                    commandParam: '::' + object.table + '|' + object.label,
                    icon: yTableLinkIcon,
                    label: object.title,
                    class: 'ck-rex-ytable-link-option',
                    withText: true
                })
            };

            itemDefinitions.add(def);
        });
    }

    return itemDefinitions;
}

// @private
function getRexDefaults(item) {
    let object = {'icon':'', 'title':''};
    switch (item) {
        case 'internal':
            object.icon = internlinkIcon;
            object.title = 'Internal';
            break;
        case 'media':
            object.icon = medialinkIcon;
            object.title = 'Media';
            break;
        case 'email':
            object.icon = emailLinkIcon;
            object.title = 'Email';
            break;
        case 'phone':
            object.icon = phoneLinkIcon;
            object.title = 'Telephone';
            break;
    }
    return object;
}

// @private
function _widgetExecute(that, param) {
    switch (param) {
        case 'internal': _linkWidgetExecute(that); break;
        case 'media': _mediaWidgetExecute(that); break;
        case 'email': _emailWidgetExecute(that); break;
        case 'phone': _phoneWidgetExecute(that); break;
    }
    if (param.substring(0,2) === '::') {
        let string = param.replace(/^::/,''),
            options = string.split(/\|/);
        _ytableWidgetExecute(that, options[0], options[1]);
    }
}

// @private
function _ytableWidgetExecute(that, table, column) {
    let pool = newPoolWindow('index.php?page=yform/manager/data_edit&table_name=' + table + '&rex_yform_manager_opener[id]=1&rex_yform_manager_opener[field]=' + column + '&rex_yform_manager_opener[multiple]=0');

    const urlInputView = that.linkFormView.urlInputView;

    $(pool).on('rex:YForm_selectData', function (event, id, label) {
        event.preventDefault();
        pool.close();

        let linkUrl = table.split('_').join('-') + '://' + id;

        // The line below will be probably executed inside some callback.
        urlInputView.fieldView.element.value = linkUrl;

        _replaceLabel(that, linkUrl, label);
    });
}

// @private
function _mediaWidgetExecute(that) {
    let media_path = that.editor.config.get('rexLink.media_path'),
        mediaPool = openMediaPool('cke5_medialink'),
        mediaPath = '/media/';

    const urlInputView = that.linkFormView.urlInputView;

    if (typeof media_path === 'undefined') {
    } else {
        mediaPath = media_path;
    }

    $(mediaPool).on('rex:selectMedia', function (event, filename) {
        event.preventDefault();
        mediaPool.close();
        // The line below will be probably executed inside some callback.
        urlInputView.fieldView.element.value = mediaPath + filename;
    });
}

// @private
function _linkWidgetExecute(that) {
    let url = location.search,
        editor = that.editor,
        clang = 1, // default 1
        query_string = url.substring(url.indexOf('?') + 1).split('&');

    for (let i = 0, result = {}; i < query_string.length; i++) {
        query_string[i] = query_string[i].split('=');
        if (query_string[i][0] == 'clang') {
            clang = query_string[i][1]; // set by url
            break;
        }
    }

    let linkMap = openLinkMap('', '&clang=' + clang);

    const urlInputView = that.linkFormView.urlInputView;

    $(linkMap).on('rex:selectLink', function (event, linkUrl, linkLabel) {
        event.preventDefault();
        linkMap.close();

        // The line below will be probably executed inside some callback.
        urlInputView.fieldView.element.value = linkUrl;

        _replaceLabel(that, linkUrl, linkLabel);
    });
}

// @private
function _emailWidgetExecute(that) {
    const urlInputView = that.linkFormView.urlInputView;
    urlInputView.fieldView.element.value = 'mailto:';
}

// @private
function _phoneWidgetExecute(that) {
    const urlInputView = that.linkFormView.urlInputView;
    urlInputView.fieldView.element.value = 'tel:+49';
}

// @private
function _replaceLabel(that, url, label) {
    let editor = that.editor;

    $(that.linkFormView.element).on('submit', function () {
        let regex = '>' + url + '<',
            matches = editor.getData().match(regex);

        label = label.replace(/^([^\[]+)\s|(\[(.*)\])/gm, "$1");

        if (matches) {
            let result = editor.getData().replace(regex, '>' + label + '<');
            editor.setData(result);
        }
    });
}
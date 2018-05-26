import ButtonView from '@ckeditor/ckeditor5-ui/src/button/buttonview';
import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import LinkUI from '@ckeditor/ckeditor5-link/src/linkui';

import internlinkIcon from 'ckeditor5-rexlink/theme/icons/internlink.svg';
import medialinkIcon from 'ckeditor5-rexlink/theme/icons/medialink.svg';

/**
 * @extends module:core/plugin~Plugin
 */
export default class Rexlink extends Plugin {
    /**
     * @inheritDoc
     */
    constructor( editor ) {
        super( editor );
        editor.config.define( 'link.rexlink', [ 'internal', 'media' ] );
    }

    /**
     * @inheritDoc
     */
    init() {
        const editor = this.editor;
        const linkUI = editor.plugins.get( LinkUI );
        const rexlinkConfig = editor.config.get( 'link.rexlink' );

        this.linkFormView = linkUI.formView;
        this.linkButton = this._createInternalLinkButton();
        this.mediaButton = this._createInternalMediaLinkButton();

        this.linkFormView.once( 'render', () => {
            // to use this in for each callback
            const that = this;

            rexlinkConfig.forEach(function(item, index, array) {
                if (item == 'internal') {
                    // Render button's tamplate.
                    that.linkButton.render();
                    // Register the button under the link form view, it will handle its destruction.
                    that.linkFormView.registerChild( that.linkButton );
                    // Inject the element into DOM.
                    that.linkFormView.element.insertBefore( that.linkButton.element, that.linkFormView.saveButtonView.element );
                }
                if (item == 'media') {
                    // Render button's tamplate.
                    that.mediaButton.render();
                    // Register the button under the link form view, it will handle its destruction.
                    that.linkFormView.registerChild( that.mediaButton );
                    // Inject the element into DOM.
                    that.linkFormView.element.insertBefore( that.mediaButton.element, that.linkFormView.saveButtonView.element );
                }
            });

        } );
    }

    _createInternalLinkButton() {
        const editor = this.editor;
        const button = new ButtonView( this.locale );
        const linkCommand = editor.commands.get( 'link' );

        button.set( {
            label: 'Internal link',
            icon: internlinkIcon,
            withText: false,
            tooltip: true
        } );

        // Probably this button should be also disabled when the link command is disabled.
        // Try setting editor.isReadOnly = true to see it in action.
        button.bind( 'isEnabled' ).to( linkCommand );

        button.on( 'execute', () => {
            // Do something (like open the popup), then update the link URL field's value.

            var linkMap = openLinkMap('', '&clang=1');
            const urlInputView = this.linkFormView.urlInputView;
            const thatLinkFormView = this.linkFormView.element;

            $(linkMap).on('rex:selectLink', function (event, linkurl, linktext) {
                event.preventDefault();
                linkMap.close();

                // The line below will be probably executed inside some callback.
                urlInputView.value = linkurl;

                $(thatLinkFormView).on('submit', function(){
                    var regex = '>' + linkurl + '<',
                        matches = editor.getData().match(regex);

                    if (matches) {
                        var result = editor.getData().replace(regex, '>' + linktext + '<');
                        editor.setData(result);
                    }
                });
            });

        } );

        return button;
    }

    _createInternalMediaLinkButton() {
        const editor = this.editor;
        const button = new ButtonView( this.locale );
        const linkCommand = editor.commands.get( 'link' );

        button.set( {
            label: 'Media link',
            icon: medialinkIcon,
            withText: false,
            tooltip: true
        } );

        // Probably this button should be also disabled when the link command is disabled.
        // Try setting editor.isReadOnly = true to see it in action.
        button.bind( 'isEnabled' ).to( linkCommand );

        button.on( 'execute', () => {
            // Do something (like open the popup), then update the link URL field's value.

            var mediaPool = openMediaPool('cke5_medialink');
            const urlInputView = this.linkFormView.urlInputView;

            $(mediaPool).on('rex:selectMedia', function (event, filename) {
                event.preventDefault();
                mediaPool.close();

                // The line below will be probably executed inside some callback.
                urlInputView.value = '/media/' + filename;
            });

        } );

        return button;
    }
}
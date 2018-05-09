import ButtonView from '@ckeditor/ckeditor5-ui/src/button/buttonview';
import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import LinkUI from '@ckeditor/ckeditor5-link/src/linkui';

/**
 * @extends module:core/plugin~Plugin
 */
export default class Rexlink extends Plugin {
    init() {
        const editor = this.editor;
        const linkUI = editor.plugins.get( LinkUI );

        this.linkFormView = linkUI.formView;
        this.linkButton = this._createInternalLinkButton();
        this.mediaButton = this._createInternalMediaLinkButton();

        this.linkFormView.once( 'render', () => {
            // Render button's tamplate.
            this.linkButton.render();
            this.mediaButton.render();

            // Register the button under the link form view, it will handle its destruction.
            this.linkFormView.registerChild( this.linkButton );
            this.linkFormView.registerChild( this.mediaButton );

            // Inject the element into DOM.
            this.linkFormView.element.insertBefore( this.linkButton.element, this.linkFormView.saveButtonView.element );
            this.linkFormView.element.insertBefore( this.mediaButton.element, this.linkFormView.saveButtonView.element );
        } );
    }

    _createInternalLinkButton() {
        const editor = this.editor;
        const button = new ButtonView( this.locale );
        const linkCommand = editor.commands.get( 'link' );

        button.set( {
            label: 'Internal link',
            withText: true,
            tooltip: true
        } );

        // Probably this button should be also disabled when the link command is disabled.
        // Try setting editor.isReadOnly = true to see it in action.
        button.bind( 'isEnabled' ).to( linkCommand );

        button.on( 'execute', () => {
            // Do something (like open the popup), then update the link URL field's value.

            var linkMap = openLinkMap('', '&clang=1');
            const urlInputView = this.linkFormView.urlInputView;

            $(linkMap).on('rex:selectLink', function (event, linkurl, linktext) {
                event.preventDefault();
                linkMap.close();

                // The line below will be probably executed inside some callback.
                urlInputView.value = linkurl;
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
            withText: true,
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

                console.log(filename);

                // The line below will be probably executed inside some callback.
                urlInputView.value = filename;
            });

        } );

        return button;
    }
}
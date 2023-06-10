/**
 * @module RexLink/RexLink
 */

import { Plugin, type Editor, Command } from '@ckeditor/ckeditor5-core';
import LinkUI from '@ckeditor/ckeditor5-link/src/linkui';
import type LinkFormView from '@ckeditor/ckeditor5-link/src/ui/linkformview';
import Collection from '@ckeditor/ckeditor5-utils/src/collection';
import Model from '@ckeditor/ckeditor5-ui/src/model';
import type { ListDropdownItemDefinition } from '@ckeditor/ckeditor5-ui/src/dropdown/utils';
// eslint-disable-next-line no-duplicate-imports
import { createDropdown, addListToDropdown } from '@ckeditor/ckeditor5-ui/src/dropdown/utils';
import type { DropdownView, ViewWithCssTransitionDisabler, InputTextView, LabeledFieldView } from '@ckeditor/ckeditor5-ui';
// eslint-disable-next-line no-duplicate-imports
import { ButtonView } from '@ckeditor/ckeditor5-ui';

import internlinkIcon from '../theme/icons/internlink.svg';
import medialinkIcon from '../theme/icons/medialink.svg';
import redaxolinkIcon from '../theme/icons/redaxolink.svg';
import emailLinkIcon from '../theme/icons/emaillink.svg';
import phoneLinkIcon from '../theme/icons/phonelink.svg';
import yTableLinkIcon from '../theme/icons/ytablelink.svg';

// TODO data-link-category => 14, data-media-category => 1, data-media-type => 'jpg,png' -> options like mform custom link
// TODO open media link by media id
// TODO custom icon for ytable widget dropdown links

export default class RexLink extends Plugin {
	public static get pluginName(): 'RexLink' {
		return 'RexLink';
	}

	/**
	 * @inheritDoc
	 */
	public static get requires() {
		return [ LinkUI ] as const;
	}

	/**
	 * The form view displayed inside the balloon.
	 */
	public linkFormView: LinkFormView & ViewWithCssTransitionDisabler | null = null;

	constructor( editor: Editor ) {
		super( editor );

		editor.config.define( 'link.rexlink', [ 'internal', 'media', 'email', 'phone' ] );
		editor.config.define( 'link.ytable', [] );
	}

	public init(): void {
		const editor = this.editor;
		const linkUI = editor.plugins.get( LinkUI );
		const contextualBalloonPlugin = editor.plugins.get( 'ContextualBalloon' );

		this.listenTo( contextualBalloonPlugin, 'change:visibleView', ( event, name, visibleView ) => {
			if ( visibleView === linkUI.formView ) {
				this.stopListening( contextualBalloonPlugin, 'change:visibleView' );
				this.#extendView( linkUI );
			}
		} );
	}

	#extendView( linkUI: LinkUI ): void {
		// eslint-disable-next-line @typescript-eslint/no-this-alias
		const that = this;
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		const rexLinkConfig: Array<string> = this.editor.config.get( 'link.rexlink' );
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		const yTableLinkConfig: Array<{ table: string; label: string; title: string }> = this.editor.config.get( 'link.ytable' );
		let rexItemButton: ButtonView | DropdownView | null = null;
		this.linkFormView = linkUI.formView;

		// add single or dropdown button to link
		if ( Array.isArray( rexLinkConfig ) && rexLinkConfig.length > 0 ) {
			if ( rexLinkConfig.length === 1 ) {
				if ( rexLinkConfig.includes( 'ytable' ) && yTableLinkConfig.length > 0 ) {
					rexItemButton = that.#createLinkDropDown( rexLinkConfig, yTableLinkConfig );
				} else {
					rexItemButton = that.#createLinkButton( rexLinkConfig[ 0 ] );
				}
			} else {
				rexItemButton = that.#createLinkDropDown( rexLinkConfig, yTableLinkConfig );
			}
		}

		if ( rexItemButton != null ) {
			rexItemButton.render(); // Render button's tamplate.
			if ( this.linkFormView != null ) {
				// Register the button under the link form view, it will handle its destruction.
				this.linkFormView.registerChild( rexItemButton );
				if ( this.linkFormView.element != null && rexItemButton.element != null ) {
					// Inject the element into DOM.
					this.linkFormView.element.insertBefore( rexItemButton.element, this.linkFormView.saveButtonView.element );
				}
			}
		}

		/* if ( this.linkFormView != null && this.linkFormView.element != null ) {
			const button = this.#createButton( this.linkFormView );
			// Render button's tamplate.
			button.render();
			if ( button instanceof ButtonView && button.element != null ) {
				// Register the button under the link form view, it will handle its destruction.
				this.linkFormView.registerChild( button );
				// Inject the element into DOM.
				this.linkFormView.element.insertBefore( button.element, this.linkFormView.saveButtonView.element );
			}
		} */
	}

	/* #createButton( linkFormView: LinkFormView ) {
		const button = new ButtonView( this.editor.locale );
		const linkCommand = this.editor.commands.get( 'link' );

		button.set( {
			label: 'Internal link',
			withText: true,
			tooltip: true
		} );

		// Probably this button should be also disabled when the link command is disabled.
		// Try setting editor.isReadOnly = true to see it in action.
		if ( linkCommand instanceof Command ) {
			button.bind( 'isEnabled' ).to( linkCommand );
		}

		if ( linkFormView != null ) {
			button.on( 'execute', () => {
				// Do something (like open the popup), then update the link URL field's value.
				// The line below will be probably executed inside some callback.
				if ( linkFormView.urlInputView.fieldView.element != null ) {
					// set the url
					linkFormView.urlInputView.fieldView.element.value = 'http://some.internal.link';
					// Focus the input
					linkFormView.urlInputView.fieldView.focus();
				}
			} );
		}
		return button;
	} */

	#writeFieldValue( value: string, urlInputView: LabeledFieldView<InputTextView> ): void {
		if ( urlInputView.fieldView != null && urlInputView.fieldView.element != null ) {
			// set the url
			urlInputView.fieldView.element.value = value;
			// Focus the input
			urlInputView.fieldView.focus();
		}
	}

	#createLinkDropDown( rexLinkConfig: Array<string>, yTableLinkConfig: Array<{ table: string; label: string; title: string }> ) {
		const editor = this.editor;
		const dropdown = createDropdown( this.editor.locale );
		const linkCommand = editor.commands.get( 'link' );
		let title = 'Redaxo yTable-Link-Widgets';

		if ( rexLinkConfig.includes( 'ytable' ) === true ) {
			title = 'Redaxo Link-Widgets';
		}

		addListToDropdown( dropdown, this.#prepareDropdownItemsCollection( rexLinkConfig, yTableLinkConfig ) );

		// Create dropdown model.#cd
		dropdown.buttonView.set( {
			label: title,
			icon: redaxolinkIcon,
			withText: false,
			tooltip: true
		} );

		dropdown.extendTemplate( {
			attributes: {
				class: [
					'ck-redaxo-link-dropdown'
				]
			}
		} );

		// Probably this button should be also disabled when the link command is disabled.
		// Try setting editor.isReadOnly = true to see it in action.
		if ( linkCommand != null ) {
			dropdown.bind( 'isEnabled' ).to( linkCommand );
		}

		dropdown.on( 'execute', event => {
			if ( event.source != null ) {
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore
				const commandParam: string | null = event.source.commandParam;
				if ( commandParam != null ) {
					this.#widgetExecute( commandParam );
				}
			}
		} );

		// Execute command when an item from the dropdown is selected.
		// this.listenTo(dropdown, 'execute', evt => {
		// console.log('listeneTo execute');
		// console.log(evt.source.commandName);
		// console.log(evt.source.commandParam);
		// });

		return dropdown;
	}

	#createLinkButton( type: string ): ButtonView {
		const button = new ButtonView( this.editor.locale );
		const object = this.#getRexDefaults( type );
		const linkCommand = this.editor.commands.get( 'link' );

		button.set( {
			label: object.title,
			icon: object.icon,
			withText: false,
			tooltip: true
		} );

		// Probably this button should be also disabled when the link command is disabled.
		// Try setting editor.isReadOnly = true to see it in action.
		if ( linkCommand instanceof Command ) {
			button.bind( 'isEnabled' ).to( linkCommand );
		}

		button.on( 'execute', () => {
			// Do something (like open the popup), then update the link URL field's value.
			this.#widgetExecute( type );
		} );
		return button;
	}

	#getRexDefaults( type: string ): { icon: string; title: string; param: string } {
		const object = { 'icon': '', 'title': '', 'param': '' };
		switch ( type ) {
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

	// eslint-disable-next-line max-len
	#prepareDropdownItemsCollection( rexLinkConfig: Array<string>, yTableLinkConfig: Array<{ table: string; label: string; title: string }> ): Collection<ListDropdownItemDefinition> {
		const collection = new Collection<ListDropdownItemDefinition>();

		if ( rexLinkConfig.length > 0 ) {
			rexLinkConfig.forEach( type => {
				if ( type === 'ytable' ) {
					if ( yTableLinkConfig.length > 0 ) {
						yTableLinkConfig.forEach( function( object ) {
							collection.add( {
								type: 'button',
								model: new Model( {
									commandName: 'link',
									commandParam: '::' + object.table + '|' + object.label,
									icon: yTableLinkIcon,
									label: object.title,
									class: 'ck-rex-ytable-link-option',
									withText: true
								} )
							} );
						} );
					}
				} else {
					const object = this.#getRexDefaults( type );
					collection.add( {
						type: 'button',
						model: new Model( {
							commandName: 'link',
							commandParam: type,
							icon: object.icon,
							label: object.title,
							class: 'ck-rex-link-option',
							withText: true
						} )
					} );
				}
			} );
		}

		return collection;
	}

	#widgetExecute( type: string ): void {
		switch ( type ) {
			case 'media': return this.#mediaWidgetExecute();
			case 'internal': return this.#linkWidgetExecute();
			case 'email': return this.#emailWidgetExecute();
			case 'phone': return this.#phoneWidgetExecute();
		}
		if ( type.substring( 0, 2 ) === '::' ) {
			const string = type.replace( /^::/, '' );
			const options = string.split( /\|/ );
			this.#ytableWidgetExecute( options[ 0 ], options[ 1 ] );
		}
	}

	#linkWidgetExecute() {
		// eslint-disable-next-line @typescript-eslint/no-this-alias
		const that = this;
		const url = location.search;
		let clang = 1; // default 1
		const queryString = url.substring( url.indexOf( '?' ) + 1 ).split( '&' );

		for ( let i = 0; i < queryString.length; i++ ) {
			const result = queryString[ i ].split( '=' );
			if ( result[ 0 ] === 'clang' ) {
				clang = Number( result[ 1 ] ); // set by url
				break;
			}
		}

		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		const linkMap = openLinkMap( '', '&clang=' + clang );
		let urlInputView: LabeledFieldView<InputTextView> | null = null;

		if ( this.linkFormView != null ) {
			urlInputView = this.linkFormView.urlInputView;
		}

		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		$( linkMap ).on( 'rex:selectLink', ( event: any, linkUrl: string, linkLabel: string ) => {
			event.preventDefault();
			linkMap.close();

			that.#replaceLabelOnSubmit( that.editor, linkUrl, linkLabel );

			if ( urlInputView != null ) {
				// The line below will be probably executed inside some callback.
				that.#writeFieldValue( linkUrl, urlInputView );
			}
		} );
	}

	#mediaWidgetExecute() {
		// eslint-disable-next-line @typescript-eslint/no-this-alias
		const that = this;
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		const configMediaPath: string = this.editor.config.get( 'rexLink.media_path' );
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		const mediaPool = openMediaPool( 'cke5_medialink' );
		let mediaPath = '/media/';
		let urlInputView: LabeledFieldView<InputTextView> | null = null;

		if ( this.linkFormView != null ) {
			urlInputView = this.linkFormView.urlInputView;
		}

		if ( typeof configMediaPath !== 'undefined' ) {
			mediaPath = configMediaPath;
		}

		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		$( mediaPool ).on( 'rex:selectMedia', ( event: any, filename: string ) => {
			event.preventDefault();
			mediaPool.close();

			that.#replaceLabelOnSubmit( that.editor, mediaPath + filename, filename );

			if ( urlInputView != null ) {
				// The line below will be probably executed inside some callback.
				that.#writeFieldValue( mediaPath + filename, urlInputView );
			}
		} );
	}

	#emailWidgetExecute() {
		return this.#prefixWidgetExecute( 'mailto:', 'mailto:' );
	}

	#phoneWidgetExecute() {
		return this.#prefixWidgetExecute( 'tel:+49', 'tel:' );
	}

	#prefixWidgetExecute( prefix: string, prefixLabelReplace: string ) {
		// eslint-disable-next-line @typescript-eslint/no-this-alias
		const that = this;
		let urlInputView: LabeledFieldView<InputTextView> | null = null;
		if ( this.linkFormView != null ) {
			urlInputView = this.linkFormView.urlInputView;
			this.linkFormView.on( 'submit', () => {
				console.log( 'execute submit' );
				if ( urlInputView != null && urlInputView.fieldView != null && urlInputView.fieldView.element != null ) {
					const value = urlInputView.fieldView.element.value;
					that.#replaceLabel( this.editor, value, value.replace( prefixLabelReplace, '' ) );
				}
			} );
		}
		if ( urlInputView != null ) {
			this.#writeFieldValue( prefix, urlInputView );
		}
	}

	#ytableWidgetExecute( table: string, column: string ) {
		// eslint-disable-next-line @typescript-eslint/no-this-alias
		const that = this;
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		// eslint-disable-next-line max-len
		const pool = newPoolWindow( 'index.php?page=yform/manager/data_edit&table_name=' + table + '&rex_yform_manager_opener[id]=1&rex_yform_manager_opener[field]=' + column + '&rex_yform_manager_opener[multiple]=0' );
		let urlInputView: LabeledFieldView<InputTextView> | null = null;

		if ( this.linkFormView != null ) {
			urlInputView = this.linkFormView.urlInputView;
		}

		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		$( pool ).on( 'rex:YForm_selectData', ( event: any, id: string, label: string ) => {
			event.preventDefault();
			pool.close();

			const linkUrl = table.split( '_' ).join( '-' ) + '://' + id;
			that.#replaceLabelOnSubmit( that.editor, linkUrl, label );

			// The line below will be probably executed inside some callback.
			if ( urlInputView != null ) {
				this.#writeFieldValue( linkUrl, urlInputView );
			}
		} );
	}

	#replaceLabelOnSubmit( editor: Editor, url: string, label: string ): void {
		if ( this.linkFormView != null ) {
			this.linkFormView.on( 'submit', () => {
				this.#replaceLabel( editor, url, label );
			} );
		}
	}

	#replaceLabel( editor: Editor, url: string, label: string ): void {
		// remove article number from replacement label
		label = label.replace( /^([^\[]+)\s|(\[(.*)\])/gm, '$1' );
		// replace url in tag with replacement label
		editor.data.set( editor.data.get().replace( '>' + url + '<', '>' + label + '<' ) );
	}
}

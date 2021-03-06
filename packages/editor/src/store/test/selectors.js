/**
 * External dependencies
 */
import { filter, without } from 'lodash';

/**
 * WordPress dependencies
 */
import {
	registerBlockType,
	unregisterBlockType,
	createBlock,
	getBlockTypes,
	getDefaultBlockName,
	setDefaultBlockName,
	getUnknownTypeHandlerName,
	setUnknownTypeHandlerName,
} from '@wordpress/blocks';
import { moment } from '@wordpress/date';
import { RawHTML } from '@wordpress/element';

/**
 * Internal dependencies
 */
import * as selectors from '../selectors';
import { PREFERENCES_DEFAULTS } from '../defaults';

const {
	canUserUseUnfilteredHTML,
	hasEditorUndo,
	hasEditorRedo,
	isEditedPostNew,
	isEditedPostDirty,
	isCleanNewPost,
	getCurrentPost,
	getCurrentPostId,
	getCurrentPostLastRevisionId,
	getCurrentPostRevisionsCount,
	getCurrentPostType,
	getPostEdits,
	getEditedPostVisibility,
	isCurrentPostPending,
	isCurrentPostPublished,
	isCurrentPostScheduled,
	isEditedPostPublishable,
	isEditedPostSaveable,
	isEditedPostAutosaveable,
	getAutosave,
	hasAutosave,
	isEditedPostEmpty,
	isEditedPostBeingScheduled,
	isEditedPostDateFloating,
	getBlockDependantsCacheBust,
	getBlockName,
	getBlock,
	getBlocks,
	getBlockCount,
	getClientIdsWithDescendants,
	hasSelectedBlock,
	getSelectedBlock,
	getSelectedBlockClientId,
	getBlockRootClientId,
	getCurrentPostAttribute,
	getEditedPostAttribute,
	getAutosaveAttribute,
	getGlobalBlockCount,
	getMultiSelectedBlockClientIds,
	getMultiSelectedBlocks,
	getMultiSelectedBlocksStartClientId,
	getMultiSelectedBlocksEndClientId,
	getBlockOrder,
	getBlockIndex,
	getPreviousBlockClientId,
	getNextBlockClientId,
	isBlockSelected,
	hasSelectedInnerBlock,
	isBlockWithinSelection,
	hasMultiSelection,
	isBlockMultiSelected,
	isFirstMultiSelectedBlock,
	getBlockMode,
	isTyping,
	getBlockInsertionPoint,
	isBlockInsertionPointVisible,
	isSavingPost,
	didPostSaveRequestSucceed,
	didPostSaveRequestFail,
	getSuggestedPostFormat,
	getEditedPostContent,
	getNotices,
	getReusableBlock,
	isSavingReusableBlock,
	isFetchingReusableBlock,
	isSelectionEnabled,
	getReusableBlocks,
	getStateBeforeOptimisticTransaction,
	isPublishingPost,
	isPublishSidebarEnabled,
	canInsertBlockType,
	getInserterItems,
	isValidTemplate,
	getTemplate,
	getTemplateLock,
	getBlockListSettings,
	POST_UPDATE_TRANSACTION_ID,
	isPermalinkEditable,
	getPermalink,
	getPermalinkParts,
	INSERTER_UTILITY_HIGH,
	INSERTER_UTILITY_MEDIUM,
	INSERTER_UTILITY_LOW,
} = selectors;

describe( 'selectors', () => {
	let cachedSelectors;

	beforeAll( () => {
		cachedSelectors = filter( selectors, ( selector ) => selector.clear );
	} );

	beforeEach( () => {
		registerBlockType( 'core/block', {
			save: () => null,
			category: 'reusable',
			title: 'Reusable Block Stub',
			supports: {
				inserter: false,
			},
		} );

		registerBlockType( 'core/test-block-a', {
			save: ( props ) => props.attributes.text,
			category: 'formatting',
			title: 'Test Block A',
			icon: 'test',
			keywords: [ 'testing' ],
		} );

		registerBlockType( 'core/test-block-b', {
			save: ( props ) => props.attributes.text,
			category: 'common',
			title: 'Test Block B',
			icon: 'test',
			keywords: [ 'testing' ],
			supports: {
				multiple: false,
			},
		} );

		registerBlockType( 'core/test-block-c', {
			save: ( props ) => props.attributes.text,
			category: 'common',
			title: 'Test Block C',
			icon: 'test',
			keywords: [ 'testing' ],
			parent: [ 'core/test-block-b' ],
		} );

		cachedSelectors.forEach( ( { clear } ) => clear() );
	} );

	afterEach( () => {
		unregisterBlockType( 'core/block' );
		unregisterBlockType( 'core/test-block-a' );
		unregisterBlockType( 'core/test-block-b' );
		unregisterBlockType( 'core/test-block-c' );
	} );

	describe( 'hasEditorUndo', () => {
		it( 'should return true when the past history is not empty', () => {
			const state = {
				editor: {
					past: [
						{},
					],
				},
			};

			expect( hasEditorUndo( state ) ).toBe( true );
		} );

		it( 'should return false when the past history is empty', () => {
			const state = {
				editor: {
					past: [],
				},
			};

			expect( hasEditorUndo( state ) ).toBe( false );
		} );
	} );

	describe( 'hasEditorRedo', () => {
		it( 'should return true when the future history is not empty', () => {
			const state = {
				editor: {
					future: [
						{},
					],
				},
			};

			expect( hasEditorRedo( state ) ).toBe( true );
		} );

		it( 'should return false when the future history is empty', () => {
			const state = {
				editor: {
					future: [],
				},
			};

			expect( hasEditorRedo( state ) ).toBe( false );
		} );
	} );

	describe( 'isEditedPostNew', () => {
		it( 'should return true when the post is new', () => {
			const state = {
				currentPost: {
					status: 'auto-draft',
				},
				editor: {
					present: {
						edits: {
							status: 'draft',
						},
					},
				},
			};

			expect( isEditedPostNew( state ) ).toBe( true );
		} );

		it( 'should return false when the post is not new', () => {
			const state = {
				currentPost: {
					status: 'draft',
				},
				editor: {
					present: {
						edits: {
							status: 'draft',
						},
					},
				},
			};

			expect( isEditedPostNew( state ) ).toBe( false );
		} );
	} );

	describe( 'isEditedPostDirty', () => {
		it( 'should return true when post saved state dirty', () => {
			const state = {
				editor: {
					isDirty: true,
				},
				saving: {
					requesting: false,
				},
			};

			expect( isEditedPostDirty( state ) ).toBe( true );
		} );

		it( 'should return true if pending transaction with dirty state', () => {
			const state = {
				optimist: [
					{
						beforeState: {
							editor: {
								isDirty: true,
							},
						},
					},
				],
				editor: {
					isDirty: false,
				},
			};

			expect( isEditedPostDirty( state ) ).toBe( true );
		} );

		it( 'should return false when post saved state not dirty', () => {
			const state = {
				editor: {
					isDirty: false,
				},
				saving: {
					requesting: false,
				},
			};

			expect( isEditedPostDirty( state ) ).toBe( false );
		} );
	} );

	describe( 'isCleanNewPost', () => {
		it( 'should return true when the post is not dirty and has not been saved before', () => {
			const state = {
				editor: {
					isDirty: false,
				},
				currentPost: {
					id: 1,
					status: 'auto-draft',
				},
				saving: {
					requesting: false,
				},
			};

			expect( isCleanNewPost( state ) ).toBe( true );
		} );

		it( 'should return false when the post is not dirty but the post has been saved', () => {
			const state = {
				editor: {
					isDirty: false,
				},
				currentPost: {
					id: 1,
					status: 'draft',
				},
				saving: {
					requesting: false,
				},
			};

			expect( isCleanNewPost( state ) ).toBe( false );
		} );

		it( 'should return false when the post is dirty but the post has not been saved', () => {
			const state = {
				editor: {
					isDirty: true,
				},
				currentPost: {
					id: 1,
					status: 'auto-draft',
				},
				saving: {
					requesting: false,
				},
			};

			expect( isCleanNewPost( state ) ).toBe( false );
		} );
	} );

	describe( 'getCurrentPost', () => {
		it( 'should return the current post', () => {
			const state = {
				currentPost: { id: 1 },
			};

			expect( getCurrentPost( state ) ).toEqual( { id: 1 } );
		} );
	} );

	describe( 'getCurrentPostId', () => {
		it( 'should return null if the post has not yet been saved', () => {
			const state = {
				currentPost: {},
			};

			expect( getCurrentPostId( state ) ).toBeNull();
		} );

		it( 'should return the current post ID', () => {
			const state = {
				currentPost: { id: 1 },
			};

			expect( getCurrentPostId( state ) ).toBe( 1 );
		} );
	} );

	describe( 'getCurrentPostAttribute', () => {
		it( 'should return undefined for an attribute which does not exist', () => {
			const state = {
				currentPost: {},
			};

			expect( getCurrentPostAttribute( state, 'foo' ) ).toBeUndefined();
		} );

		it( 'should return undefined for object prototype member', () => {
			const state = {
				currentPost: {},
			};

			expect( getCurrentPostAttribute( state, 'valueOf' ) ).toBeUndefined();
		} );

		it( 'should return the value of an attribute', () => {
			const state = {
				currentPost: {
					title: 'Hello World',
				},
			};

			expect( getCurrentPostAttribute( state, 'title' ) ).toBe( 'Hello World' );
		} );
	} );

	describe( 'getEditedPostAttribute', () => {
		it( 'should return the current post’s slug if no edits have been made', () => {
			const state = {
				currentPost: { slug: 'post slug' },
				editor: {
					present: {
						edits: {},
					},
				},
			};

			expect( getEditedPostAttribute( state, 'slug' ) ).toBe( 'post slug' );
		} );

		it( 'should return the latest slug if edits have been made to the post', () => {
			const state = {
				currentPost: { slug: 'old slug' },
				editor: {
					present: {
						edits: {
							slug: 'new slug',
						},
					},
				},
			};

			expect( getEditedPostAttribute( state, 'slug' ) ).toBe( 'new slug' );
		} );

		it( 'should return the post saved title if the title is not edited', () => {
			const state = {
				currentPost: {
					title: 'sassel',
				},
				editor: {
					present: {
						edits: { status: 'private' },
					},
				},
			};

			expect( getEditedPostAttribute( state, 'title' ) ).toBe( 'sassel' );
		} );

		it( 'should return the edited title', () => {
			const state = {
				currentPost: {
					title: 'sassel',
				},
				editor: {
					present: {
						edits: { title: 'youcha' },
					},
				},
			};

			expect( getEditedPostAttribute( state, 'title' ) ).toBe( 'youcha' );
		} );

		it( 'should return undefined for object prototype member', () => {
			const state = {
				currentPost: {},
				editor: {
					present: {
						edits: {},
					},
				},
			};

			expect( getEditedPostAttribute( state, 'valueOf' ) ).toBeUndefined();
		} );
	} );

	describe( 'getAutosaveAttribute', () => {
		it( 'returns null if there is no autosave', () => {
			const state = {
				autosave: null,
			};

			expect( getAutosaveAttribute( state, 'title' ) ).toBeNull();
		} );

		it( 'returns undefined for an attribute which is not set', () => {
			const state = {
				autosave: {},
			};

			expect( getAutosaveAttribute( state, 'foo' ) ).toBeUndefined();
		} );

		it( 'returns undefined for object prototype member', () => {
			const state = {
				autosave: {},
			};

			expect( getAutosaveAttribute( state, 'valueOf' ) ).toBeUndefined();
		} );

		it( 'returns the attribute value', () => {
			const state = {
				autosave: {
					title: 'Hello World',
				},
			};

			expect( getAutosaveAttribute( state, 'title' ) ).toBe( 'Hello World' );
		} );
	} );

	describe( 'getCurrentPostLastRevisionId', () => {
		it( 'should return null if the post has not yet been saved', () => {
			const state = {
				currentPost: {},
			};

			expect( getCurrentPostLastRevisionId( state ) ).toBeNull();
		} );

		it( 'should return the last revision ID', () => {
			const state = {
				currentPost: {
					_links: {
						'predecessor-version': [
							{
								id: 123,
							},
						],
					},
				},
			};

			expect( getCurrentPostLastRevisionId( state ) ).toBe( 123 );
		} );
	} );

	describe( 'getCurrentPostRevisionsCount', () => {
		it( 'should return 0 if the post has no revisions', () => {
			const state = {
				currentPost: {},
			};

			expect( getCurrentPostRevisionsCount( state ) ).toBe( 0 );
		} );

		it( 'should return the number of revisions', () => {
			const state = {
				currentPost: {
					_links: {
						'version-history': [
							{
								count: 5,
							},
						],
					},
				},
			};

			expect( getCurrentPostRevisionsCount( state ) ).toBe( 5 );
		} );
	} );

	describe( 'getCurrentPostType', () => {
		it( 'should return the post type', () => {
			const state = {
				currentPost: {
					type: 'post',
				},
			};

			expect( getCurrentPostType( state ) ).toBe( 'post' );
		} );
	} );

	describe( 'getPostEdits', () => {
		it( 'should return the post edits', () => {
			const state = {
				editor: {
					present: {
						edits: { title: 'terga' },
					},
				},
			};

			expect( getPostEdits( state ) ).toEqual( { title: 'terga' } );
		} );
	} );

	describe( 'getEditedPostVisibility', () => {
		it( 'should return public by default', () => {
			const state = {
				currentPost: {
					status: 'draft',
				},
				editor: {
					present: {
						edits: {},
					},
				},
			};

			expect( getEditedPostVisibility( state ) ).toBe( 'public' );
		} );

		it( 'should return private for private posts', () => {
			const state = {
				currentPost: {
					status: 'private',
				},
				editor: {
					present: {
						edits: {},
					},
				},
			};

			expect( getEditedPostVisibility( state ) ).toBe( 'private' );
		} );

		it( 'should return private for password for password protected posts', () => {
			const state = {
				currentPost: {
					status: 'draft',
					password: 'chicken',
				},
				editor: {
					present: {
						edits: {},
					},
				},
			};

			expect( getEditedPostVisibility( state ) ).toBe( 'password' );
		} );

		it( 'should use the edited status and password if edits present', () => {
			const state = {
				currentPost: {
					status: 'draft',
					password: 'chicken',
				},
				editor: {
					present: {
						edits: {
							status: 'private',
							password: null,
						},
					},
				},
			};

			expect( getEditedPostVisibility( state ) ).toBe( 'private' );
		} );
	} );

	describe( 'isCurrentPostPending', () => {
		it( 'should return true for posts in pending state', () => {
			const state = {
				currentPost: {
					status: 'pending',
				},
			};

			expect( isCurrentPostPending( state ) ).toBe( true );
		} );

		it( 'should return false for draft posts', () => {
			const state = {
				currentPost: {
					status: 'draft',
				},
			};

			expect( isCurrentPostPending( state ) ).toBe( false );
		} );

		it( 'should return false if status is unknown', () => {
			const state = {
				currentPost: {},
			};

			expect( isCurrentPostPending( state ) ).toBe( false );
		} );
	} );

	describe( 'isCurrentPostPublished', () => {
		it( 'should return true for public posts', () => {
			const state = {
				currentPost: {
					status: 'publish',
				},
			};

			expect( isCurrentPostPublished( state ) ).toBe( true );
		} );

		it( 'should return true for private posts', () => {
			const state = {
				currentPost: {
					status: 'private',
				},
			};

			expect( isCurrentPostPublished( state ) ).toBe( true );
		} );

		it( 'should return false for draft posts', () => {
			const state = {
				currentPost: {
					status: 'draft',
				},
			};

			expect( isCurrentPostPublished( state ) ).toBe( false );
		} );

		it( 'should return true for old scheduled posts', () => {
			const state = {
				currentPost: {
					status: 'future',
					date: '2016-05-30T17:21:39',
				},
			};

			expect( isCurrentPostPublished( state ) ).toBe( true );
		} );
	} );

	describe( 'isCurrentPostScheduled', () => {
		it( 'should return true for future scheduled posts', () => {
			const state = {
				currentPost: {
					status: 'future',
					date: '2100-05-30T17:21:39',
				},
			};

			expect( isCurrentPostScheduled( state ) ).toBe( true );
		} );

		it( 'should return false for old scheduled posts that were already published', () => {
			const state = {
				currentPost: {
					status: 'future',
					date: '2016-05-30T17:21:39',
				},
			};

			expect( isCurrentPostScheduled( state ) ).toBe( false );
		} );

		it( 'should return false for auto draft posts', () => {
			const state = {
				currentPost: {
					status: 'auto-draft',
				},
			};

			expect( isCurrentPostScheduled( state ) ).toBe( false );
		} );

		it( 'should return false if status is unknown', () => {
			const state = {
				currentPost: {},
			};

			expect( isCurrentPostScheduled( state ) ).toBe( false );
		} );
	} );

	describe( 'isEditedPostPublishable', () => {
		it( 'should return true for pending posts', () => {
			const state = {
				editor: {
					isDirty: false,
				},
				currentPost: {
					status: 'pending',
				},
				saving: {
					requesting: false,
				},
			};

			expect( isEditedPostPublishable( state ) ).toBe( true );
		} );

		it( 'should return true for draft posts', () => {
			const state = {
				editor: {
					isDirty: false,
				},
				currentPost: {
					status: 'draft',
				},
				saving: {
					requesting: false,
				},
			};

			expect( isEditedPostPublishable( state ) ).toBe( true );
		} );

		it( 'should return false for published posts', () => {
			const state = {
				editor: {
					isDirty: false,
				},
				currentPost: {
					status: 'publish',
				},
				saving: {
					requesting: false,
				},
			};

			expect( isEditedPostPublishable( state ) ).toBe( false );
		} );

		it( 'should return true for published, dirty posts', () => {
			const state = {
				editor: {
					isDirty: true,
				},
				currentPost: {
					status: 'publish',
				},
				saving: {
					requesting: false,
				},
			};

			expect( isEditedPostPublishable( state ) ).toBe( true );
		} );

		it( 'should return false for private posts', () => {
			const state = {
				editor: {
					isDirty: false,
				},
				currentPost: {
					status: 'private',
				},
				saving: {
					requesting: false,
				},
			};

			expect( isEditedPostPublishable( state ) ).toBe( false );
		} );

		it( 'should return false for scheduled posts', () => {
			const state = {
				editor: {
					isDirty: false,
				},
				currentPost: {
					status: 'future',
				},
				saving: {
					requesting: false,
				},
			};

			expect( isEditedPostPublishable( state ) ).toBe( false );
		} );

		it( 'should return true for dirty posts with usable title', () => {
			const state = {
				currentPost: {
					status: 'private',
				},
				editor: {
					isDirty: true,
				},
				saving: {
					requesting: false,
				},
			};

			expect( isEditedPostPublishable( state ) ).toBe( true );
		} );
	} );

	describe( 'isEditedPostSaveable', () => {
		it( 'should return false if the post has no title, excerpt, content', () => {
			const state = {
				editor: {
					present: {
						blocksByClientId: {},
						blockOrder: {},
						edits: {},
					},
				},
				currentPost: {},
				saving: {},
			};

			expect( isEditedPostSaveable( state ) ).toBe( false );
		} );

		it( 'should return false if the post has a title but save already in progress', () => {
			const state = {
				editor: {
					present: {
						blocksByClientId: {},
						blockOrder: {},
						edits: {},
					},
				},
				currentPost: {
					title: 'sassel',
				},
				saving: {
					requesting: true,
				},
			};

			expect( isEditedPostSaveable( state ) ).toBe( false );
		} );

		it( 'should return true if the post has a title', () => {
			const state = {
				editor: {
					present: {
						blocksByClientId: {},
						blockOrder: {},
						edits: {},
					},
				},
				currentPost: {
					title: 'sassel',
				},
				saving: {},
			};

			expect( isEditedPostSaveable( state ) ).toBe( true );
		} );

		it( 'should return true if the post has an excerpt', () => {
			const state = {
				editor: {
					present: {
						blocksByClientId: {},
						blockOrder: {},
						edits: {},
					},
				},
				currentPost: {
					excerpt: 'sassel',
				},
				saving: {},
			};

			expect( isEditedPostSaveable( state ) ).toBe( true );
		} );

		it( 'should return true if the post has content', () => {
			const state = {
				editor: {
					present: {
						blocksByClientId: {
							123: {
								clientId: 123,
								name: 'core/test-block',
								attributes: {
									text: '',
								},
							},
						},
						blockOrder: {
							'': [ 123 ],
						},
						edits: {},
					},
				},
				currentPost: {},
				saving: {},
			};

			expect( isEditedPostSaveable( state ) ).toBe( true );
		} );
	} );

	describe( 'isEditedPostAutosaveable', () => {
		it( 'should return false if the post is not saveable', () => {
			const state = {
				editor: {
					present: {
						blocksByClientId: {},
						blockOrder: {},
						edits: {},
					},
				},
				currentPost: {
					title: 'sassel',
				},
				saving: {
					requesting: true,
				},
				autosave: {
					title: 'sassel',
				},
			};

			expect( isEditedPostAutosaveable( state ) ).toBe( false );
		} );

		it( 'should return true if there is not yet an autosave', () => {
			const state = {
				editor: {
					present: {
						blocksByClientId: {},
						blockOrder: {},
						edits: {},
					},
				},
				currentPost: {
					title: 'sassel',
				},
				saving: {},
				autosave: null,
			};

			expect( isEditedPostAutosaveable( state ) ).toBe( true );
		} );

		it( 'should return false if none of title, excerpt, or content have changed', () => {
			const state = {
				editor: {
					present: {
						blocksByClientId: {},
						blockOrder: {},
						edits: {
							content: 'foo',
						},
					},
				},
				currentPost: {
					title: 'foo',
					content: 'foo',
					excerpt: 'foo',
				},
				saving: {},
				autosave: {
					title: 'foo',
					content: 'foo',
					excerpt: 'foo',
				},
			};

			expect( isEditedPostAutosaveable( state ) ).toBe( false );
		} );

		it( 'should return true if title, excerpt, or content have changed', () => {
			for ( const variantField of [ 'title', 'excerpt', 'content' ] ) {
				for ( const constantField of without( [ 'title', 'excerpt', 'content' ], variantField ) ) {
					const state = {
						editor: {
							present: {
								blocksByClientId: {},
								blockOrder: {},
								edits: {
									content: 'foo',
								},
							},
						},
						currentPost: {
							title: 'foo',
							content: 'foo',
							excerpt: 'foo',
						},
						saving: {},
						autosave: {
							[ constantField ]: 'foo',
							[ variantField ]: 'bar',
						},
					};

					expect( isEditedPostAutosaveable( state ) ).toBe( true );
				}
			}
		} );
	} );

	describe( 'getAutosave', () => {
		it( 'returns null if there is no autosave', () => {
			const state = {
				autosave: null,
			};

			const result = getAutosave( state );

			expect( result ).toBe( null );
		} );

		it( 'returns the autosave', () => {
			const autosave = { title: '', excerpt: '', content: '' };
			const state = { autosave };

			const result = getAutosave( state );

			expect( result ).toEqual( autosave );
		} );
	} );

	describe( 'hasAutosave', () => {
		it( 'returns false if there is no autosave', () => {
			const state = {
				autosave: null,
			};

			const result = hasAutosave( state );

			expect( result ).toBe( false );
		} );

		it( 'returns true if there is a autosave', () => {
			const state = {
				autosave: { title: '', excerpt: '', content: '' },
			};

			const result = hasAutosave( state );

			expect( result ).toBe( true );
		} );
	} );

	describe( 'isEditedPostEmpty', () => {
		it( 'should return true if no blocks and no content', () => {
			const state = {
				editor: {
					present: {
						blocksByClientId: {},
						blockOrder: {},
						edits: {},
					},
				},
				currentPost: {},
			};

			expect( isEditedPostEmpty( state ) ).toBe( true );
		} );

		it( 'should return false if blocks', () => {
			const state = {
				editor: {
					present: {
						blocksByClientId: {
							123: {
								clientId: 123,
								name: 'core/test-block',
								attributes: {
									text: '',
								},
							},
						},
						blockOrder: {
							'': [ 123 ],
						},
						edits: {},
					},
				},
				currentPost: {},
			};

			expect( isEditedPostEmpty( state ) ).toBe( false );
		} );

		it( 'should return true if the post has an empty content property', () => {
			const state = {
				editor: {
					present: {
						blocksByClientId: {},
						blockOrder: {},
						edits: {},
					},
				},
				currentPost: {
					content: '',
				},
			};

			expect( isEditedPostEmpty( state ) ).toBe( true );
		} );

		it( 'should return false if edits include a non-empty content property', () => {
			const state = {
				editor: {
					present: {
						blocksByClientId: {},
						blockOrder: {},
						edits: {
							content: 'sassel',
						},
					},
				},
				currentPost: {},
			};

			expect( isEditedPostEmpty( state ) ).toBe( false );
		} );
	} );

	describe( 'isEditedPostBeingScheduled', () => {
		it( 'should return true for posts with a future date', () => {
			const state = {
				editor: {
					present: {
						edits: { date: moment().add( 7, 'days' ).format( '' ) },
					},
				},
			};

			expect( isEditedPostBeingScheduled( state ) ).toBe( true );
		} );

		it( 'should return false for posts with an old date', () => {
			const state = {
				editor: {
					present: {
						edits: { date: '2016-05-30T17:21:39' },
					},
				},
			};

			expect( isEditedPostBeingScheduled( state ) ).toBe( false );
		} );
	} );

	describe( 'isEditedPostDateFloating', () => {
		let editor;

		beforeEach( () => {
			editor = {
				present: {
					edits: {},
				},
			};
		} );

		it( 'should return true for draft posts where the date matches the modified date', () => {
			const state = {
				currentPost: {
					date: '2018-09-27T01:23:45.678Z',
					modified: '2018-09-27T01:23:45.678Z',
					status: 'draft',
				},
				editor,
			};

			expect( isEditedPostDateFloating( state ) ).toBe( true );
		} );

		it( 'should return true for auto-draft posts where the date matches the modified date', () => {
			const state = {
				currentPost: {
					date: '2018-09-27T01:23:45.678Z',
					modified: '2018-09-27T01:23:45.678Z',
					status: 'auto-draft',
				},
				editor,
			};

			expect( isEditedPostDateFloating( state ) ).toBe( true );
		} );

		it( 'should return false for draft posts where the date does not match the modified date', () => {
			const state = {
				currentPost: {
					date: '2018-09-27T01:23:45.678Z',
					modified: '1970-01-01T00:00:00.000Z',
					status: 'draft',
				},
				editor,
			};

			expect( isEditedPostDateFloating( state ) ).toBe( false );
		} );

		it( 'should return false for auto-draft posts where the date does not match the modified date', () => {
			const state = {
				currentPost: {
					date: '2018-09-27T01:23:45.678Z',
					modified: '1970-01-01T00:00:00.000Z',
					status: 'auto-draft',
				},
				editor,
			};

			expect( isEditedPostDateFloating( state ) ).toBe( false );
		} );

		it( 'should return false for published posts', () => {
			const state = {
				currentPost: {
					date: '2018-09-27T01:23:45.678Z',
					modified: '2018-09-27T01:23:45.678Z',
					status: 'publish',
				},
				editor,
			};

			expect( isEditedPostDateFloating( state ) ).toBe( false );
		} );
	} );

	describe( 'getBlockDependantsCacheBust', () => {
		const rootBlock = { clientId: 123, name: 'core/paragraph', attributes: {} };
		const rootOrder = [ 123 ];

		it( 'returns an unchanging reference', () => {
			const rootBlockOrder = [];

			const state = {
				currentPost: {},
				editor: {
					present: {
						blocksByClientId: {
							123: rootBlock,
						},
						blockOrder: {
							'': rootOrder,
							123: rootBlockOrder,
						},
						edits: {},
					},
				},
			};

			const nextState = {
				currentPost: {},
				editor: {
					present: {
						blocksByClientId: {
							123: rootBlock,
						},
						blockOrder: {
							'': rootOrder,
							123: rootBlockOrder,
						},
						edits: {},
					},
				},
			};

			expect(
				getBlockDependantsCacheBust( state, 123 )
			).toBe( getBlockDependantsCacheBust( nextState, 123 ) );
		} );

		it( 'returns a new reference on added inner block', () => {
			const state = {
				currentPost: {},
				editor: {
					present: {
						blocksByClientId: {
							123: rootBlock,
						},
						blockOrder: {
							'': rootOrder,
							123: [],
						},
						edits: {},
					},
				},
			};

			const nextState = {
				currentPost: {},
				editor: {
					present: {
						blocksByClientId: {
							123: rootBlock,
							456: { clientId: 456, name: 'core/paragraph', attributes: {} },
						},
						blockOrder: {
							'': rootOrder,
							123: [ 456 ],
							456: [],
						},
						edits: {},
					},
				},
			};

			expect(
				getBlockDependantsCacheBust( state, 123 )
			).not.toBe( getBlockDependantsCacheBust( nextState, 123 ) );
		} );

		it( 'returns an unchanging reference on unchanging inner block', () => {
			const rootBlockOrder = [ 456 ];
			const childBlock = { clientId: 456, name: 'core/paragraph', attributes: {} };
			const childBlockOrder = [];

			const state = {
				currentPost: {},
				editor: {
					present: {
						blocksByClientId: {
							123: rootBlock,
							456: childBlock,
						},
						blockOrder: {
							'': rootOrder,
							123: rootBlockOrder,
							456: childBlockOrder,
						},
						edits: {},
					},
				},
			};

			const nextState = {
				currentPost: {},
				editor: {
					present: {
						blocksByClientId: {
							123: rootBlock,
							456: childBlock,
						},
						blockOrder: {
							'': rootOrder,
							123: rootBlockOrder,
							456: childBlockOrder,
						},
						edits: {},
					},
				},
			};

			expect(
				getBlockDependantsCacheBust( state, 123 )
			).toBe( getBlockDependantsCacheBust( nextState, 123 ) );
		} );

		it( 'returns a new reference on updated inner block', () => {
			const rootBlockOrder = [ 456 ];
			const childBlockOrder = [];

			const state = {
				currentPost: {},
				editor: {
					present: {
						blocksByClientId: {
							123: rootBlock,
							456: { clientId: 456, name: 'core/paragraph', attributes: {} },
						},
						blockOrder: {
							'': rootOrder,
							123: rootBlockOrder,
							456: childBlockOrder,
						},
						edits: {},
					},
				},
			};

			const nextState = {
				currentPost: {},
				editor: {
					present: {
						blocksByClientId: {
							123: rootBlock,
							456: { clientId: 456, name: 'core/paragraph', attributes: { content: [ 'foo' ] } },
						},
						blockOrder: {
							'': rootOrder,
							123: rootBlockOrder,
							456: childBlockOrder,
						},
						edits: {},
					},
				},
			};

			expect(
				getBlockDependantsCacheBust( state, 123 )
			).not.toBe( getBlockDependantsCacheBust( nextState, 123 ) );
		} );

		it( 'returns a new reference on updated grandchild inner block', () => {
			const rootBlockOrder = [ 456 ];
			const childBlock = { clientId: 456, name: 'core/paragraph', attributes: {} };
			const childBlockOrder = [ 789 ];
			const grandChildBlockOrder = [];

			const state = {
				currentPost: {},
				editor: {
					present: {
						blocksByClientId: {
							123: rootBlock,
							456: childBlock,
							789: { clientId: 789, name: 'core/paragraph', attributes: {} },
						},
						blockOrder: {
							'': rootOrder,
							123: rootBlockOrder,
							456: childBlockOrder,
							789: grandChildBlockOrder,
						},
						edits: {},
					},
				},
			};

			const nextState = {
				currentPost: {},
				editor: {
					present: {
						blocksByClientId: {
							123: rootBlock,
							456: childBlock,
							789: { clientId: 789, name: 'core/paragraph', attributes: { content: [ 'foo' ] } },
						},
						blockOrder: {
							'': rootOrder,
							123: rootBlockOrder,
							456: childBlockOrder,
							789: grandChildBlockOrder,
						},
						edits: {},
					},
				},
			};

			expect(
				getBlockDependantsCacheBust( state, 123 )
			).not.toBe( getBlockDependantsCacheBust( nextState, 123 ) );
		} );
	} );

	describe( 'getBlockName', () => {
		it( 'returns null if no block by clientId', () => {
			const state = {
				currentPost: {},
				editor: {
					present: {
						blocksByClientId: {},
						blockOrder: {},
						edits: {},
					},
				},
			};

			const name = getBlockName( state, 'afd1cb17-2c08-4e7a-91be-007ba7ddc3a1' );

			expect( name ).toBe( null );
		} );

		it( 'returns block name', () => {
			const state = {
				currentPost: {},
				editor: {
					present: {
						blocksByClientId: {
							'afd1cb17-2c08-4e7a-91be-007ba7ddc3a1': {
								clientId: 'afd1cb17-2c08-4e7a-91be-007ba7ddc3a1',
								name: 'core/paragraph',
								attributes: {},
							},
						},
						blockOrder: {
							'': [ 'afd1cb17-2c08-4e7a-91be-007ba7ddc3a1' ],
							'afd1cb17-2c08-4e7a-91be-007ba7ddc3a1': [],
						},
						edits: {},
					},
				},
			};

			const name = getBlockName( state, 'afd1cb17-2c08-4e7a-91be-007ba7ddc3a1' );

			expect( name ).toBe( 'core/paragraph' );
		} );
	} );

	describe( 'getBlock', () => {
		it( 'should return the block', () => {
			const state = {
				currentPost: {},
				editor: {
					present: {
						blocksByClientId: {
							123: { clientId: 123, name: 'core/paragraph', attributes: {} },
						},
						blockOrder: {
							'': [ 123 ],
							123: [],
						},
						edits: {},
					},
				},
			};

			expect( getBlock( state, 123 ) ).toEqual( {
				clientId: 123,
				name: 'core/paragraph',
				attributes: {},
				innerBlocks: [],
			} );
		} );

		it( 'should return null if the block is not present in state', () => {
			const state = {
				currentPost: {},
				editor: {
					present: {
						blocksByClientId: {},
						blockOrder: {},
						edits: {},
					},
				},
			};

			expect( getBlock( state, 123 ) ).toBe( null );
		} );

		it( 'should include inner blocks', () => {
			const state = {
				currentPost: {},
				editor: {
					present: {
						blocksByClientId: {
							123: { clientId: 123, name: 'core/paragraph', attributes: {} },
							456: { clientId: 456, name: 'core/paragraph', attributes: {} },
						},
						blockOrder: {
							'': [ 123 ],
							123: [ 456 ],
							456: [],
						},
						edits: {},
					},
				},
			};

			expect( getBlock( state, 123 ) ).toEqual( {
				clientId: 123,
				name: 'core/paragraph',
				attributes: {},
				innerBlocks: [ {
					clientId: 456,
					name: 'core/paragraph',
					attributes: {},
					innerBlocks: [],
				} ],
			} );
		} );

		it( 'should merge meta attributes for the block', () => {
			registerBlockType( 'core/meta-block', {
				save: ( props ) => props.attributes.text,
				category: 'common',
				title: 'test block',
				attributes: {
					foo: {
						type: 'string',
						source: 'meta',
						meta: 'foo',
					},
				},
			} );

			const state = {
				currentPost: {
					meta: {
						foo: 'bar',
					},
				},
				editor: {
					present: {
						blocksByClientId: {
							123: { clientId: 123, name: 'core/meta-block', attributes: {} },
						},
						blockOrder: {
							'': [ 123 ],
							123: [],
						},
						edits: {},
					},
				},
			};

			expect( getBlock( state, 123 ) ).toEqual( {
				clientId: 123,
				name: 'core/meta-block',
				attributes: {
					foo: 'bar',
				},
				innerBlocks: [],
			} );

			unregisterBlockType( 'core/meta-block' );
		} );
	} );

	describe( 'getBlocks', () => {
		it( 'should return the ordered blocks', () => {
			const state = {
				currentPost: {},
				editor: {
					present: {
						blocksByClientId: {
							23: { clientId: 23, name: 'core/heading', attributes: {} },
							123: { clientId: 123, name: 'core/paragraph', attributes: {} },
						},
						blockOrder: {
							'': [ 123, 23 ],
						},
						edits: {},
					},
				},
			};

			expect( getBlocks( state ) ).toEqual( [
				{ clientId: 123, name: 'core/paragraph', attributes: {}, innerBlocks: [] },
				{ clientId: 23, name: 'core/heading', attributes: {}, innerBlocks: [] },
			] );
		} );
	} );

	describe( 'getClientIdsWithDescendants', () => {
		it( 'should return the ids for top-level blocks and their descendants of any depth (for nested blocks).', () => {
			const state = {
				currentPost: {},
				editor: {
					present: {
						blocksByClientId: {
							'uuid-2': { clientId: 'uuid-2', name: 'core/image', attributes: {} },
							'uuid-4': { clientId: 'uuid-4', name: 'core/paragraph', attributes: {} },
							'uuid-6': { clientId: 'uuid-6', name: 'core/paragraph', attributes: {} },
							'uuid-8': { clientId: 'uuid-8', name: 'core/block', attributes: {} },
							'uuid-10': { clientId: 'uuid-10', name: 'core/columns', attributes: {} },
							'uuid-12': { clientId: 'uuid-12', name: 'core/column', attributes: {} },
							'uuid-14': { clientId: 'uuid-14', name: 'core/column', attributes: {} },
							'uuid-16': { clientId: 'uuid-16', name: 'core/quote', attributes: {} },
							'uuid-18': { clientId: 'uuid-18', name: 'core/block', attributes: {} },
							'uuid-20': { clientId: 'uuid-20', name: 'core/gallery', attributes: {} },
							'uuid-22': { clientId: 'uuid-22', name: 'core/block', attributes: {} },
							'uuid-24': { clientId: 'uuid-24', name: 'core/columns', attributes: {} },
							'uuid-26': { clientId: 'uuid-26', name: 'core/column', attributes: {} },
							'uuid-28': { clientId: 'uuid-28', name: 'core/column', attributes: {} },
							'uuid-30': { clientId: 'uuid-30', name: 'core/paragraph', attributes: {} },
						},
						blockOrder: {
							'': [ 'uuid-6', 'uuid-8', 'uuid-10', 'uuid-22' ],
							'uuid-2': [ ],
							'uuid-4': [ ],
							'uuid-6': [ ],
							'uuid-8': [ ],
							'uuid-10': [ 'uuid-12', 'uuid-14' ],
							'uuid-12': [ 'uuid-16' ],
							'uuid-14': [ 'uuid-18' ],
							'uuid-16': [ ],
							'uuid-18': [ 'uuid-24' ],
							'uuid-20': [ ],
							'uuid-22': [ ],
							'uuid-24': [ 'uuid-26', 'uuid-28' ],
							'uuid-26': [ ],
							'uuid-28': [ 'uuid-30' ],
						},
						edits: {},
					},
				},
			};
			expect( getClientIdsWithDescendants( state ) ).toEqual( [
				'uuid-6',
				'uuid-8',
				'uuid-10',
				'uuid-22',
				'uuid-12',
				'uuid-14',
				'uuid-16',
				'uuid-18',
				'uuid-24',
				'uuid-26',
				'uuid-28',
				'uuid-30',
			] );
		} );
	} );

	describe( 'getBlockCount', () => {
		it( 'should return the number of top-level blocks in the post', () => {
			const state = {
				editor: {
					present: {
						blocksByClientId: {
							23: { clientId: 23, name: 'core/heading', attributes: {} },
							123: { clientId: 123, name: 'core/paragraph', attributes: {} },
						},
						blockOrder: {
							'': [ 123, 23 ],
						},
					},
				},
			};

			expect( getBlockCount( state ) ).toBe( 2 );
		} );

		it( 'should return the number of blocks in a nested context', () => {
			const state = {
				editor: {
					present: {
						blocksByClientId: {
							123: { clientId: 123, name: 'core/columns', attributes: {} },
							456: { clientId: 456, name: 'core/paragraph', attributes: {} },
							789: { clientId: 789, name: 'core/paragraph', attributes: {} },
						},
						blockOrder: {
							'': [ 123 ],
							123: [ 456, 789 ],
						},
					},
				},
			};

			expect( getBlockCount( state, '123' ) ).toBe( 2 );
		} );
	} );

	describe( 'hasSelectedBlock', () => {
		it( 'should return false if no selection', () => {
			const state = {
				blockSelection: {
					start: null,
					end: null,
				},
			};

			expect( hasSelectedBlock( state ) ).toBe( false );
		} );

		it( 'should return false if multi-selection', () => {
			const state = {
				blockSelection: {
					start: 'afd1cb17-2c08-4e7a-91be-007ba7ddc3a1',
					end: '9db792c6-a25a-495d-adbd-97d56a4c4189',
				},
			};

			expect( hasSelectedBlock( state ) ).toBe( false );
		} );

		it( 'should return true if singular selection', () => {
			const state = {
				blockSelection: {
					start: 'afd1cb17-2c08-4e7a-91be-007ba7ddc3a1',
					end: 'afd1cb17-2c08-4e7a-91be-007ba7ddc3a1',
				},
			};

			expect( hasSelectedBlock( state ) ).toBe( true );
		} );
	} );

	describe( 'getGlobalBlockCount', () => {
		it( 'should return the global number of top-level blocks in the post', () => {
			const state = {
				editor: {
					present: {
						blocksByClientId: {
							23: { clientId: 23, name: 'core/heading', attributes: {} },
							123: { clientId: 123, name: 'core/paragraph', attributes: {} },
						},
					},
				},
			};

			expect( getGlobalBlockCount( state ) ).toBe( 2 );
		} );

		it( 'should return the global umber of blocks of a given type', () => {
			const state = {
				editor: {
					present: {
						blocksByClientId: {
							123: { clientId: 123, name: 'core/columns', attributes: {} },
							456: { clientId: 456, name: 'core/paragraph', attributes: {} },
							789: { clientId: 789, name: 'core/paragraph', attributes: {} },
							124: { clientId: 123, name: 'core/heading', attributes: {} },
						},
					},
				},
			};

			expect( getGlobalBlockCount( state, 'core/heading' ) ).toBe( 1 );
		} );

		it( 'should return 0 if no blocks exist', () => {
			const state = {
				editor: {
					present: {
						blocksByClientId: {
						},
					},
				},
			};
			expect( getGlobalBlockCount( state ) ).toBe( 0 );
			expect( getGlobalBlockCount( state, 'core/heading' ) ).toBe( 0 );
		} );
	} );

	describe( 'getSelectedBlockClientId', () => {
		it( 'should return null if no block is selected', () => {
			const state = {
				blockSelection: { start: null, end: null },
			};

			expect( getSelectedBlockClientId( state ) ).toBe( null );
		} );

		it( 'should return null if there is multi selection', () => {
			const state = {
				blockSelection: { start: 23, end: 123 },
			};

			expect( getSelectedBlockClientId( state ) ).toBe( null );
		} );

		it( 'should return the selected block ClientId', () => {
			const state = {
				blockSelection: { start: 23, end: 23 },
			};

			expect( getSelectedBlockClientId( state ) ).toEqual( 23 );
		} );
	} );

	describe( 'getSelectedBlock', () => {
		it( 'should return null if no block is selected', () => {
			const state = {
				currentPost: {},
				editor: {
					present: {
						blocksByClientId: {
							23: { clientId: 23, name: 'core/heading', attributes: {} },
							123: { clientId: 123, name: 'core/paragraph', attributes: {} },
						},
						blockOrder: {
							'': [ 23, 123 ],
							23: [],
							123: [],
						},
						edits: {},
					},
				},
				blockSelection: { start: null, end: null },
			};

			expect( getSelectedBlock( state ) ).toBe( null );
		} );

		it( 'should return null if there is multi selection', () => {
			const state = {
				currentPost: {},
				editor: {
					present: {
						blocksByClientId: {
							23: { clientId: 23, name: 'core/heading', attributes: {} },
							123: { clientId: 123, name: 'core/paragraph', attributes: {} },
						},
						blockOrder: {
							'': [ 23, 123 ],
							23: [],
							123: [],
						},
						edits: {},
					},
				},
				blockSelection: { start: 23, end: 123 },
			};

			expect( getSelectedBlock( state ) ).toBe( null );
		} );

		it( 'should return the selected block', () => {
			const state = {
				currentPost: {},
				editor: {
					present: {
						blocksByClientId: {
							23: { clientId: 23, name: 'core/heading', attributes: {} },
							123: { clientId: 123, name: 'core/paragraph', attributes: {} },
						},
						blockOrder: {
							'': [ 23, 123 ],
							23: [],
							123: [],
						},
						edits: {},
					},
				},
				blockSelection: { start: 23, end: 23 },
			};

			expect( getSelectedBlock( state ) ).toEqual( {
				clientId: 23,
				name: 'core/heading',
				attributes: {},
				innerBlocks: [],
			} );
		} );
	} );

	describe( 'getBlockRootClientId', () => {
		it( 'should return null if the block does not exist', () => {
			const state = {
				editor: {
					present: {
						blockOrder: {},
					},
				},
			};

			expect( getBlockRootClientId( state, 56 ) ).toBeNull();
		} );

		it( 'should return root ClientId relative the block ClientId', () => {
			const state = {
				editor: {
					present: {
						blockOrder: {
							'': [ 123, 23 ],
							123: [ 456, 56 ],
						},
					},
				},
			};

			expect( getBlockRootClientId( state, 56 ) ).toBe( '123' );
		} );
	} );

	describe( 'getMultiSelectedBlockClientIds', () => {
		it( 'should return empty if there is no multi selection', () => {
			const state = {
				editor: {
					present: {
						blockOrder: {
							'': [ 123, 23 ],
						},
					},
				},
				blockSelection: { start: null, end: null },
			};

			expect( getMultiSelectedBlockClientIds( state ) ).toEqual( [] );
		} );

		it( 'should return selected block clientIds if there is multi selection', () => {
			const state = {
				editor: {
					present: {
						blockOrder: {
							'': [ 5, 4, 3, 2, 1 ],
						},
					},
				},
				blockSelection: { start: 2, end: 4 },
			};

			expect( getMultiSelectedBlockClientIds( state ) ).toEqual( [ 4, 3, 2 ] );
		} );

		it( 'should return selected block clientIds if there is multi selection (nested context)', () => {
			const state = {
				editor: {
					present: {
						blockOrder: {
							'': [ 5, 4, 3, 2, 1 ],
							4: [ 9, 8, 7, 6 ],
						},
					},
				},
				blockSelection: { start: 7, end: 9 },
			};

			expect( getMultiSelectedBlockClientIds( state ) ).toEqual( [ 9, 8, 7 ] );
		} );
	} );

	describe( 'getMultiSelectedBlocks', () => {
		it( 'should return the same reference on subsequent invocations of empty selection', () => {
			const state = {
				editor: {
					present: {
						blocksByClientId: {},
						blockOrder: {},
						edits: {},
					},
				},
				blockSelection: { start: null, end: null },
				currentPost: {},
			};

			expect(
				getMultiSelectedBlocks( state )
			).toBe( getMultiSelectedBlocks( state ) );
		} );
	} );

	describe( 'getMultiSelectedBlocksStartClientId', () => {
		it( 'returns null if there is no multi selection', () => {
			const state = {
				blockSelection: { start: null, end: null },
			};

			expect( getMultiSelectedBlocksStartClientId( state ) ).toBeNull();
		} );

		it( 'returns multi selection start', () => {
			const state = {
				blockSelection: { start: 2, end: 4 },
			};

			expect( getMultiSelectedBlocksStartClientId( state ) ).toBe( 2 );
		} );
	} );

	describe( 'getMultiSelectedBlocksEndClientId', () => {
		it( 'returns null if there is no multi selection', () => {
			const state = {
				blockSelection: { start: null, end: null },
			};

			expect( getMultiSelectedBlocksEndClientId( state ) ).toBeNull();
		} );

		it( 'returns multi selection end', () => {
			const state = {
				blockSelection: { start: 2, end: 4 },
			};

			expect( getMultiSelectedBlocksEndClientId( state ) ).toBe( 4 );
		} );
	} );

	describe( 'getBlockOrder', () => {
		it( 'should return the ordered block ClientIds of top-level blocks by default', () => {
			const state = {
				editor: {
					present: {
						blockOrder: {
							'': [ 123, 23 ],
						},
					},
				},
			};

			expect( getBlockOrder( state ) ).toEqual( [ 123, 23 ] );
		} );

		it( 'should return the ordered block ClientIds at a specified rootClientId', () => {
			const state = {
				editor: {
					present: {
						blockOrder: {
							'': [ 123, 23 ],
							123: [ 456 ],
						},
					},
				},
			};

			expect( getBlockOrder( state, '123' ) ).toEqual( [ 456 ] );
		} );
	} );

	describe( 'getBlockIndex', () => {
		it( 'should return the block order', () => {
			const state = {
				editor: {
					present: {
						blockOrder: {
							'': [ 123, 23 ],
						},
					},
				},
			};

			expect( getBlockIndex( state, 23 ) ).toBe( 1 );
		} );

		it( 'should return the block order (nested context)', () => {
			const state = {
				editor: {
					present: {
						blockOrder: {
							'': [ 123, 23 ],
							123: [ 456, 56 ],
						},
					},
				},
			};

			expect( getBlockIndex( state, 56, '123' ) ).toBe( 1 );
		} );
	} );

	describe( 'getPreviousBlockClientId', () => {
		it( 'should return the previous block', () => {
			const state = {
				editor: {
					present: {
						blockOrder: {
							'': [ 123, 23 ],
						},
					},
				},
			};

			expect( getPreviousBlockClientId( state, 23 ) ).toEqual( 123 );
		} );

		it( 'should return the previous block (nested context)', () => {
			const state = {
				editor: {
					present: {
						blockOrder: {
							'': [ 123, 23 ],
							123: [ 456, 56 ],
						},
					},
				},
			};

			expect( getPreviousBlockClientId( state, 56, '123' ) ).toEqual( 456 );
		} );

		it( 'should return null for the first block', () => {
			const state = {
				editor: {
					present: {
						blockOrder: {
							'': [ 123, 23 ],
						},
					},
				},
			};

			expect( getPreviousBlockClientId( state, 123 ) ).toBeNull();
		} );

		it( 'should return null for the first block (nested context)', () => {
			const state = {
				editor: {
					present: {
						blockOrder: {
							'': [ 123, 23 ],
							123: [ 456, 56 ],
						},
					},
				},
			};

			expect( getPreviousBlockClientId( state, 456, '123' ) ).toBeNull();
		} );
	} );

	describe( 'getNextBlockClientId', () => {
		it( 'should return the following block', () => {
			const state = {
				editor: {
					present: {
						blockOrder: {
							'': [ 123, 23 ],
						},
					},
				},
			};

			expect( getNextBlockClientId( state, 123 ) ).toEqual( 23 );
		} );

		it( 'should return the following block (nested context)', () => {
			const state = {
				editor: {
					present: {
						blockOrder: {
							'': [ 123, 23 ],
							123: [ 456, 56 ],
						},
					},
				},
			};

			expect( getNextBlockClientId( state, 456, '123' ) ).toEqual( 56 );
		} );

		it( 'should return null for the last block', () => {
			const state = {
				editor: {
					present: {
						blockOrder: {
							'': [ 123, 23 ],
						},
					},
				},
			};

			expect( getNextBlockClientId( state, 23 ) ).toBeNull();
		} );

		it( 'should return null for the last block (nested context)', () => {
			const state = {
				editor: {
					present: {
						blockOrder: {
							'': [ 123, 23 ],
							123: [ 456, 56 ],
						},
					},
				},
			};

			expect( getNextBlockClientId( state, 56, '123' ) ).toBeNull();
		} );
	} );

	describe( 'isBlockSelected', () => {
		it( 'should return true if the block is selected', () => {
			const state = {
				blockSelection: { start: 123, end: 123 },
			};

			expect( isBlockSelected( state, 123 ) ).toBe( true );
		} );

		it( 'should return false if a multi-selection range exists', () => {
			const state = {
				blockSelection: { start: 123, end: 124 },
			};

			expect( isBlockSelected( state, 123 ) ).toBe( false );
		} );

		it( 'should return false if the block is not selected', () => {
			const state = {
				blockSelection: { start: null, end: null },
			};

			expect( isBlockSelected( state, 23 ) ).toBe( false );
		} );
	} );

	describe( 'hasSelectedInnerBlock', () => {
		it( 'should return false if the selected block is a child of the given ClientId', () => {
			const state = {
				blockSelection: { start: 5, end: 5 },
				editor: {
					present: {
						blockOrder: {
							4: [ 3, 2, 1 ],
						},
					},
				},
			};

			expect( hasSelectedInnerBlock( state, 4 ) ).toBe( false );
		} );

		it( 'should return true if the selected block is a child of the given ClientId', () => {
			const state = {
				blockSelection: { start: 3, end: 3 },
				editor: {
					present: {
						blockOrder: {
							4: [ 3, 2, 1 ],
						},
					},
				},
			};

			expect( hasSelectedInnerBlock( state, 4 ) ).toBe( true );
		} );

		it( 'should return true if a multi selection exists that contains children of the block with the given ClientId', () => {
			const state = {
				editor: {
					present: {
						blockOrder: {
							6: [ 5, 4, 3, 2, 1 ],
						},
					},
				},
				blockSelection: { start: 2, end: 4 },
			};
			expect( hasSelectedInnerBlock( state, 6 ) ).toBe( true );
		} );

		it( 'should return false if a multi selection exists bot does not contains children of the block with the given ClientId', () => {
			const state = {
				editor: {
					present: {
						blockOrder: {
							3: [ 2, 1 ],
							6: [ 5, 4 ],
						},
					},
				},
				blockSelection: { start: 5, end: 4 },
			};
			expect( hasSelectedInnerBlock( state, 3 ) ).toBe( false );
		} );
	} );

	describe( 'isBlockWithinSelection', () => {
		it( 'should return true if the block is selected but not the last', () => {
			const state = {
				blockSelection: { start: 5, end: 3 },
				editor: {
					present: {
						blockOrder: {
							'': [ 5, 4, 3, 2, 1 ],
						},
					},
				},
			};

			expect( isBlockWithinSelection( state, 4 ) ).toBe( true );
		} );

		it( 'should return false if the block is the last selected', () => {
			const state = {
				blockSelection: { start: 5, end: 3 },
				editor: {
					present: {
						blockOrder: {
							'': [ 5, 4, 3, 2, 1 ],
						},
					},
				},
			};

			expect( isBlockWithinSelection( state, 3 ) ).toBe( false );
		} );

		it( 'should return false if the block is not selected', () => {
			const state = {
				blockSelection: { start: 5, end: 3 },
				editor: {
					present: {
						blockOrder: {
							'': [ 5, 4, 3, 2, 1 ],
						},
					},
				},
			};

			expect( isBlockWithinSelection( state, 2 ) ).toBe( false );
		} );

		it( 'should return false if there is no selection', () => {
			const state = {
				blockSelection: {},
				editor: {
					present: {
						blockOrder: {
							'': [ 5, 4, 3, 2, 1 ],
						},
					},
				},
			};

			expect( isBlockWithinSelection( state, 4 ) ).toBe( false );
		} );
	} );

	describe( 'hasMultiSelection', () => {
		it( 'should return false if no selection', () => {
			const state = {
				blockSelection: {
					start: null,
					end: null,
				},
			};

			expect( hasMultiSelection( state ) ).toBe( false );
		} );

		it( 'should return false if singular selection', () => {
			const state = {
				blockSelection: {
					start: 'afd1cb17-2c08-4e7a-91be-007ba7ddc3a1',
					end: 'afd1cb17-2c08-4e7a-91be-007ba7ddc3a1',
				},
			};

			expect( hasMultiSelection( state ) ).toBe( false );
		} );

		it( 'should return true if multi-selection', () => {
			const state = {
				blockSelection: {
					start: 'afd1cb17-2c08-4e7a-91be-007ba7ddc3a1',
					end: '9db792c6-a25a-495d-adbd-97d56a4c4189',
				},
			};

			expect( hasMultiSelection( state ) ).toBe( true );
		} );
	} );

	describe( 'isBlockMultiSelected', () => {
		const state = {
			editor: {
				present: {
					blockOrder: {
						'': [ 5, 4, 3, 2, 1 ],
					},
				},
			},
			blockSelection: { start: 2, end: 4 },
		};

		it( 'should return true if the block is multi selected', () => {
			expect( isBlockMultiSelected( state, 3 ) ).toBe( true );
		} );

		it( 'should return false if the block is not multi selected', () => {
			expect( isBlockMultiSelected( state, 5 ) ).toBe( false );
		} );
	} );

	describe( 'isFirstMultiSelectedBlock', () => {
		const state = {
			editor: {
				present: {
					blockOrder: {
						'': [ 5, 4, 3, 2, 1 ],
					},
				},
			},
			blockSelection: { start: 2, end: 4 },
		};

		it( 'should return true if the block is first in multi selection', () => {
			expect( isFirstMultiSelectedBlock( state, 4 ) ).toBe( true );
		} );

		it( 'should return false if the block is not first in multi selection', () => {
			expect( isFirstMultiSelectedBlock( state, 3 ) ).toBe( false );
		} );
	} );

	describe( 'getBlockMode', () => {
		it( 'should return "visual" if unset', () => {
			const state = {
				blocksMode: {},
			};

			expect( getBlockMode( state, 123 ) ).toEqual( 'visual' );
		} );

		it( 'should return the block mode', () => {
			const state = {
				blocksMode: {
					123: 'html',
				},
			};

			expect( getBlockMode( state, 123 ) ).toEqual( 'html' );
		} );
	} );

	describe( 'isTyping', () => {
		it( 'should return the isTyping flag if the block is selected', () => {
			const state = {
				isTyping: true,
			};

			expect( isTyping( state ) ).toBe( true );
		} );

		it( 'should return false if the block is not selected', () => {
			const state = {
				isTyping: false,
			};

			expect( isTyping( state ) ).toBe( false );
		} );
	} );

	describe( 'isSelectionEnabled', () => {
		it( 'should return true if selection is enable', () => {
			const state = {
				blockSelection: {
					isEnabled: true,
				},
			};

			expect( isSelectionEnabled( state ) ).toBe( true );
		} );

		it( 'should return false if selection is disabled', () => {
			const state = {
				blockSelection: {
					isEnabled: false,
				},
			};

			expect( isSelectionEnabled( state ) ).toBe( false );
		} );
	} );

	describe( 'getBlockInsertionPoint', () => {
		it( 'should return an object for the selected block', () => {
			const state = {
				currentPost: {},
				preferences: { mode: 'visual' },
				blockSelection: {
					start: 'clientId1',
					end: 'clientId1',
				},
				editor: {
					present: {
						blocksByClientId: {
							clientId1: { clientId: 'clientId1' },
						},
						blockOrder: {
							'': [ 'clientId1' ],
							clientId1: [],
						},
						edits: {},
					},
				},
				isInsertionPointVisible: false,
			};

			expect( getBlockInsertionPoint( state ) ).toEqual( {
				rootClientId: undefined,
				layout: undefined,
				index: 1,
			} );
		} );

		it( 'should return an object for the nested selected block', () => {
			const state = {
				currentPost: {},
				preferences: { mode: 'visual' },
				blockSelection: {
					start: 'clientId2',
					end: 'clientId2',
				},
				editor: {
					present: {
						blocksByClientId: {
							clientId1: { clientId: 'clientId1' },
							clientId2: { clientId: 'clientId2' },
						},
						blockOrder: {
							'': [ 'clientId1' ],
							clientId1: [ 'clientId2' ],
							clientId2: [],
						},
						edits: {},
					},
				},
				isInsertionPointVisible: false,
			};

			expect( getBlockInsertionPoint( state ) ).toEqual( {
				rootClientId: 'clientId1',
				layout: undefined,
				index: 1,
			} );
		} );

		it( 'should return an object for the selected block with layout', () => {
			const state = {
				currentPost: {},
				preferences: { mode: 'visual' },
				blockSelection: {
					start: 'clientId1',
					end: 'clientId1',
				},
				editor: {
					present: {
						blocksByClientId: {
							clientId1: { clientId: 'clientId1', attributes: { layout: 'wide' } },
						},
						blockOrder: {
							'': [ 'clientId1' ],
							clientId1: [],
						},
						edits: {},
					},
				},
				isInsertionPointVisible: false,
			};

			expect( getBlockInsertionPoint( state ) ).toEqual( {
				rootClientId: undefined,
				layout: 'wide',
				index: 1,
			} );
		} );

		it( 'should return an object for the last multi selected clientId', () => {
			const state = {
				currentPost: {},
				preferences: { mode: 'visual' },
				blockSelection: {
					start: 'clientId1',
					end: 'clientId2',
				},
				editor: {
					present: {
						blocksByClientId: {
							clientId1: { clientId: 'clientId1' },
							clientId2: { clientId: 'clientId2' },
						},
						blockOrder: {
							'': [ 'clientId1', 'clientId2' ],
							clientId1: [],
							clientId2: [],
						},
						edits: {},
					},
				},
				isInsertionPointVisible: false,
			};

			expect( getBlockInsertionPoint( state ) ).toEqual( {
				rootClientId: undefined,
				layout: undefined,
				index: 2,
			} );
		} );

		it( 'should return an object for the last block if no selection', () => {
			const state = {
				currentPost: {},
				preferences: { mode: 'visual' },
				blockSelection: {
					start: null,
					end: null,
				},
				editor: {
					present: {
						blocksByClientId: {
							clientId1: { clientId: 'clientId1' },
							clientId2: { clientId: 'clientId2' },
						},
						blockOrder: {
							'': [ 'clientId1', 'clientId2' ],
							clientId1: [],
							clientId2: [],
						},
						edits: {},
					},
				},
				isInsertionPointVisible: false,
			};

			expect( getBlockInsertionPoint( state ) ).toEqual( {
				rootClientId: undefined,
				layout: undefined,
				index: 2,
			} );
		} );
	} );

	describe( 'isBlockInsertionPointVisible', () => {
		it( 'should return the value in state', () => {
			const state = {
				isInsertionPointVisible: true,
			};

			expect( isBlockInsertionPointVisible( state ) ).toBe( true );
		} );
	} );

	describe( 'isSavingPost', () => {
		it( 'should return true if the post is currently being saved', () => {
			const state = {
				saving: {
					requesting: true,
				},
			};

			expect( isSavingPost( state ) ).toBe( true );
		} );

		it( 'should return false if the post is not currently being saved', () => {
			const state = {
				saving: {
					requesting: false,
				},
			};

			expect( isSavingPost( state ) ).toBe( false );
		} );
	} );

	describe( 'didPostSaveRequestSucceed', () => {
		it( 'should return true if the post save request is successful', () => {
			const state = {
				saving: {
					successful: true,
				},
			};

			expect( didPostSaveRequestSucceed( state ) ).toBe( true );
		} );

		it( 'should return true if the post save request has failed', () => {
			const state = {
				saving: {
					successful: false,
				},
			};

			expect( didPostSaveRequestSucceed( state ) ).toBe( false );
		} );
	} );

	describe( 'didPostSaveRequestFail', () => {
		it( 'should return true if the post save request has failed', () => {
			const state = {
				saving: {
					error: 'error',
				},
			};

			expect( didPostSaveRequestFail( state ) ).toBe( true );
		} );

		it( 'should return true if the post save request is successful', () => {
			const state = {
				saving: {
					error: false,
				},
			};

			expect( didPostSaveRequestFail( state ) ).toBe( false );
		} );
	} );

	describe( 'getSuggestedPostFormat', () => {
		it( 'returns null if cannot be determined', () => {
			const state = {
				editor: {
					present: {
						blockOrder: {},
						blocksByClientId: {},
						edits: {},
					},
				},
				currentPost: {},
			};

			expect( getSuggestedPostFormat( state ) ).toBeNull();
		} );

		it( 'returns null if there is more than one block in the post', () => {
			const state = {
				editor: {
					present: {
						blockOrder: {
							'': [ 123, 456 ],
						},
						blocksByClientId: {
							123: { clientId: 123, name: 'core/image', attributes: {} },
							456: { clientId: 456, name: 'core/quote', attributes: {} },
						},
						edits: {},
					},
				},
				currentPost: {},
			};

			expect( getSuggestedPostFormat( state ) ).toBeNull();
		} );

		it( 'returns Image if the first block is of type `core/image`', () => {
			const state = {
				editor: {
					present: {
						blockOrder: {
							'': [ 123 ],
						},
						blocksByClientId: {
							123: { clientId: 123, name: 'core/image', attributes: {} },
						},
						edits: {},
					},
				},
				currentPost: {},
			};

			expect( getSuggestedPostFormat( state ) ).toBe( 'image' );
		} );

		it( 'returns Quote if the first block is of type `core/quote`', () => {
			const state = {
				editor: {
					present: {
						blockOrder: {
							'': [ 456 ],
						},
						blocksByClientId: {
							456: { clientId: 456, name: 'core/quote', attributes: {} },
						},
						edits: {},
					},
				},
				currentPost: {},
			};

			expect( getSuggestedPostFormat( state ) ).toBe( 'quote' );
		} );

		it( 'returns Video if the first block is of type `core-embed/youtube`', () => {
			const state = {
				editor: {
					present: {
						blockOrder: {
							'': [ 567 ],
						},
						blocksByClientId: {
							567: { clientId: 567, name: 'core-embed/youtube', attributes: {} },
						},
						edits: {},
					},
				},
				currentPost: {},
			};

			expect( getSuggestedPostFormat( state ) ).toBe( 'video' );
		} );

		it( 'returns Quote if the first block is of type `core/quote` and second is of type `core/paragraph`', () => {
			const state = {
				editor: {
					present: {
						blockOrder: {
							'': [ 456, 789 ],
						},
						blocksByClientId: {
							456: { clientId: 456, name: 'core/quote', attributes: {} },
							789: { clientId: 789, name: 'core/paragraph', attributes: {} },
						},
						edits: {},
					},
				},
				currentPost: {},
			};

			expect( getSuggestedPostFormat( state ) ).toBe( 'quote' );
		} );
	} );

	describe( 'getEditedPostContent', () => {
		let originalDefaultBlockName, originalUnknownTypeHandlerName;

		beforeAll( () => {
			originalDefaultBlockName = getDefaultBlockName();
			originalUnknownTypeHandlerName = getUnknownTypeHandlerName();

			registerBlockType( 'core/default', {
				category: 'common',
				title: 'default',
				attributes: {
					modified: {
						type: 'boolean',
						default: false,
					},
				},
				save: () => null,
			} );
			registerBlockType( 'core/unknown', {
				category: 'common',
				title: 'unknown',
				attributes: {
					html: {
						type: 'string',
					},
				},
				save: ( { attributes } ) => <RawHTML>{ attributes.html }</RawHTML>,
			} );
			setDefaultBlockName( 'core/default' );
			setUnknownTypeHandlerName( 'core/unknown' );
		} );

		afterAll( () => {
			setDefaultBlockName( originalDefaultBlockName );
			setUnknownTypeHandlerName( originalUnknownTypeHandlerName );
			getBlockTypes().forEach( ( block ) => {
				unregisterBlockType( block.name );
			} );
		} );

		it( 'defers to returning an edited post attribute', () => {
			const block = createBlock( 'core/block' );

			const state = {
				editor: {
					present: {
						blockOrder: {
							'': [ block.clientId ],
						},
						blocksByClientId: {
							[ block.clientId ]: block,
						},
						edits: {
							content: 'custom edit',
						},
					},
				},
				currentPost: {},
			};

			const content = getEditedPostContent( state );

			expect( content ).toBe( 'custom edit' );
		} );

		it( 'returns serialization of blocks', () => {
			const block = createBlock( 'core/block' );

			const state = {
				editor: {
					present: {
						blockOrder: {
							'': [ block.clientId ],
						},
						blocksByClientId: {
							[ block.clientId ]: block,
						},
						edits: {},
					},
				},
				currentPost: {},
			};

			const content = getEditedPostContent( state );

			expect( content ).toBe( '<!-- wp:block /-->' );
		} );

		it( 'returns removep\'d serialization of blocks for single unknown', () => {
			const unknownBlock = createBlock( getUnknownTypeHandlerName(), {
				html: '<p>foo</p>',
			} );
			const state = {
				editor: {
					present: {
						blockOrder: {
							'': [ unknownBlock.clientId ],
						},
						blocksByClientId: {
							[ unknownBlock.clientId ]: unknownBlock,
						},
						edits: {},
					},
				},
				currentPost: {},
			};

			const content = getEditedPostContent( state );

			expect( content ).toBe( 'foo' );
		} );

		it( 'returns non-removep\'d serialization of blocks for multiple unknown', () => {
			const firstUnknown = createBlock( getUnknownTypeHandlerName(), {
				html: '<p>foo</p>',
			} );
			const secondUnknown = createBlock( getUnknownTypeHandlerName(), {
				html: '<p>bar</p>',
			} );
			const state = {
				editor: {
					present: {
						blockOrder: {
							'': [ firstUnknown.clientId, secondUnknown.clientId ],
						},
						blocksByClientId: {
							[ firstUnknown.clientId ]: firstUnknown,
							[ secondUnknown.clientId ]: secondUnknown,
						},
						edits: {},
					},
				},
				currentPost: {},
			};

			const content = getEditedPostContent( state );

			expect( content ).toBe( '<p>foo</p>\n\n<p>bar</p>' );
		} );

		it( 'returns empty string for single unmodified default block', () => {
			const defaultBlock = createBlock( getDefaultBlockName() );
			const state = {
				editor: {
					present: {
						blockOrder: {
							'': [ defaultBlock.clientId ],
						},
						blocksByClientId: {
							[ defaultBlock.clientId ]: defaultBlock,
						},
						edits: {},
					},
				},
				currentPost: {},
			};

			const content = getEditedPostContent( state );

			expect( content ).toBe( '' );
		} );

		it( 'should not return empty string for modified default block', () => {
			const defaultBlock = createBlock( getDefaultBlockName() );
			const state = {
				editor: {
					present: {
						blockOrder: {
							'': [ defaultBlock.clientId ],
						},
						blocksByClientId: {
							[ defaultBlock.clientId ]: {
								...defaultBlock,
								attributes: {
									...defaultBlock.attributes,
									modified: true,
								},
							},
						},
						edits: {},
					},
				},
				currentPost: {},
			};

			const content = getEditedPostContent( state );

			expect( content ).toBe( '<!-- wp:default {\"modified\":true} /-->' );
		} );
	} );

	describe( 'getNotices', () => {
		it( 'should return the notices array', () => {
			const state = {
				notices: [
					{ id: 'b', content: 'Post saved' },
					{ id: 'a', content: 'Error saving' },
				],
			};

			expect( getNotices( state ) ).toEqual( state.notices );
		} );
	} );

	describe( 'canInsertBlockType', () => {
		it( 'should deny blocks that are not registered', () => {
			const state = {
				editor: {
					present: {
						blocksByClientId: {},
					},
				},
				blockListSettings: {},
				settings: {},
			};
			expect( canInsertBlockType( state, 'core/invalid' ) ).toBe( false );
		} );

		it( 'should deny blocks that are not allowed by the editor', () => {
			const state = {
				editor: {
					present: {
						blocksByClientId: {},
					},
				},
				blockListSettings: {},
				settings: {
					allowedBlockTypes: [],
				},
			};
			expect( canInsertBlockType( state, 'core/test-block-a' ) ).toBe( false );
		} );

		it( 'should allow blocks that are allowed by the editor', () => {
			const state = {
				editor: {
					present: {
						blocksByClientId: {},
					},
				},
				blockListSettings: {},
				settings: {
					allowedBlockTypes: [ 'core/test-block-a' ],
				},
			};
			expect( canInsertBlockType( state, 'core/test-block-a' ) ).toBe( true );
		} );

		it( 'should deny blocks when the editor has a template lock', () => {
			const state = {
				editor: {
					present: {
						blocksByClientId: {},
					},
				},
				blockListSettings: {},
				settings: {
					templateLock: 'all',
				},
			};
			expect( canInsertBlockType( state, 'core/test-block-a' ) ).toBe( false );
		} );

		it( 'should deny blocks that restrict parent from being inserted into the root', () => {
			const state = {
				editor: {
					present: {
						blocksByClientId: {},
					},
				},
				blockListSettings: {},
				settings: {},
			};
			expect( canInsertBlockType( state, 'core/test-block-c' ) ).toBe( false );
		} );

		it( 'should deny blocks that restrict parent from being inserted into a restricted parent', () => {
			const state = {
				editor: {
					present: {
						blocksByClientId: {
							block1: { name: 'core/test-block-a' },
						},
					},
				},
				blockListSettings: {},
				settings: {},
			};
			expect( canInsertBlockType( state, 'core/test-block-c', 'block1' ) ).toBe( false );
		} );

		it( 'should allow blocks that restrict parent to be inserted into an allowed parent', () => {
			const state = {
				editor: {
					present: {
						blocksByClientId: {
							block1: { name: 'core/test-block-b' },
						},
					},
				},
				blockListSettings: {},
				settings: {},
			};
			expect( canInsertBlockType( state, 'core/test-block-c', 'block1' ) ).toBe( true );
		} );

		it( 'should deny restricted blocks from being inserted into a block that restricts allowedBlocks', () => {
			const state = {
				editor: {
					present: {
						blocksByClientId: {
							block1: { name: 'core/test-block-a' },
						},
					},
				},
				blockListSettings: {
					block1: {
						allowedBlocks: [ 'core/test-block-c' ],
					},
				},
				settings: {},
			};
			expect( canInsertBlockType( state, 'core/test-block-b', 'block1' ) ).toBe( false );
		} );

		it( 'should allow allowed blocks to be inserted into a block that restricts allowedBlocks', () => {
			const state = {
				editor: {
					present: {
						blocksByClientId: {
							block1: { name: 'core/test-block-a' },
						},
					},
				},
				blockListSettings: {
					block1: {
						allowedBlocks: [ 'core/test-block-b' ],
					},
				},
				settings: {},
			};
			expect( canInsertBlockType( state, 'core/test-block-b', 'block1' ) ).toBe( true );
		} );

		it( 'should prioritise parent over allowedBlocks', () => {
			const state = {
				editor: {
					present: {
						blocksByClientId: {
							block1: { name: 'core/test-block-b' },
						},
					},
				},
				blockListSettings: {
					block1: {
						allowedBlocks: [],
					},
				},
				settings: {},
			};
			expect( canInsertBlockType( state, 'core/test-block-c', 'block1' ) ).toBe( true );
		} );
	} );

	describe( 'getInserterItems', () => {
		it( 'should properly list block type and reusable block items', () => {
			const state = {
				editor: {
					present: {
						blocksByClientId: {
							block1: { name: 'core/test-block-a' },
						},
						blockOrder: {},
						edits: {},
					},
				},
				reusableBlocks: {
					data: {
						1: { clientId: 'block1', title: 'Reusable Block 1' },
					},
				},
				currentPost: {},
				preferences: {
					insertUsage: {},
				},
				blockListSettings: {},
				settings: {},
			};
			const items = getInserterItems( state );
			const testBlockAItem = items.find( ( item ) => item.id === 'core/test-block-a' );
			expect( testBlockAItem ).toEqual( {
				id: 'core/test-block-a',
				name: 'core/test-block-a',
				initialAttributes: {},
				title: 'Test Block A',
				icon: {
					src: 'test',
				},
				category: 'formatting',
				keywords: [ 'testing' ],
				isDisabled: false,
				utility: 0,
				frecency: 0,
				hasChildBlocksWithInserterSupport: false,
			} );
			const reusableBlockItem = items.find( ( item ) => item.id === 'core/block/1' );
			expect( reusableBlockItem ).toEqual( {
				id: 'core/block/1',
				name: 'core/block',
				initialAttributes: { ref: 1 },
				title: 'Reusable Block 1',
				icon: {
					src: 'test',
				},
				category: 'reusable',
				keywords: [],
				isDisabled: false,
				utility: 0,
				frecency: 0,
			} );
		} );

		it( 'should order items by descending utility and frecency', () => {
			const state = {
				editor: {
					present: {
						blocksByClientId: {
							block1: { name: 'core/test-block-a' },
							block2: { name: 'core/test-block-a' },
						},
						blockOrder: {},
						edits: {},
					},
				},
				reusableBlocks: {
					data: {
						1: { clientId: 'block1', title: 'Reusable Block 1' },
						2: { clientId: 'block1', title: 'Reusable Block 2' },
					},
				},
				currentPost: {},
				preferences: {
					insertUsage: {
						'core/block/1': { count: 10, time: 1000 },
						'core/block/2': { count: 20, time: 1000 },
					},
				},
				blockListSettings: {},
				settings: {},
			};
			const itemIDs = getInserterItems( state ).map( ( item ) => item.id );
			expect( itemIDs ).toEqual( [
				'core/block/2',
				'core/block/1',
				'core/test-block-b',
				'core/test-block-a',
			] );
		} );

		it( 'should correctly cache the return values', () => {
			const state = {
				editor: {
					present: {
						blocksByClientId: {
							block1: { name: 'core/test-block-a' },
							block2: { name: 'core/test-block-a' },
						},
						blockOrder: {},
						edits: {},
					},
				},
				reusableBlocks: {
					data: {
						1: { clientId: 'block1', title: 'Reusable Block 1' },
						2: { clientId: 'block1', title: 'Reusable Block 2' },
					},
				},
				currentPost: {},
				preferences: {
					insertUsage: {},
				},
				blockListSettings: {},
				settings: {},
			};

			const stateSecondBlockRestricted = {
				...state,
				blockListSettings: {
					block2: {
						allowedBlocks: [ 'core/test-block-b' ],
					},
				},
			};

			const firstBlockFirstCall = getInserterItems( state, 'block1' );
			const firstBlockSecondCall = getInserterItems( stateSecondBlockRestricted, 'block1' );
			expect( firstBlockFirstCall ).toBe( firstBlockSecondCall );
			expect( firstBlockFirstCall.map( ( item ) => item.id ) ).toEqual( [
				'core/test-block-b',
				'core/test-block-a',
				'core/block/1',
				'core/block/2',
			] );

			const secondBlockFirstCall = getInserterItems( state, 'block2' );
			const secondBlockSecondCall = getInserterItems( stateSecondBlockRestricted, 'block2' );
			expect( secondBlockFirstCall.map( ( item ) => item.id ) ).toEqual( [
				'core/test-block-b',
				'core/test-block-a',
				'core/block/1',
				'core/block/2',
			] );
			expect( secondBlockSecondCall.map( ( item ) => item.id ) ).toEqual( [
				'core/test-block-b',
			] );
		} );

		it( 'should set isDisabled when a block with `multiple: false` has been used', () => {
			const state = {
				editor: {
					present: {
						blocksByClientId: {
							block1: { clientId: 'block1', name: 'core/test-block-b' },
						},
						blockOrder: {
							'': [ 'block1' ],
						},
						edits: {},
					},
				},
				reusableBlocks: {
					data: {},
				},
				currentPost: {},
				preferences: {
					insertUsage: {},
				},
				blockListSettings: {},
				settings: {},
			};
			const items = getInserterItems( state );
			const testBlockBItem = items.find( ( item ) => item.id === 'core/test-block-b' );
			expect( testBlockBItem.isDisabled ).toBe( true );
		} );

		it( 'should give common blocks a low utility', () => {
			const state = {
				editor: {
					present: {
						blocksByClientId: {},
						blockOrder: {},
						edits: {},
					},
				},
				reusableBlocks: {
					data: {},
				},
				currentPost: {},
				preferences: {
					insertUsage: {},
				},
				blockListSettings: {},
				settings: {},
			};
			const items = getInserterItems( state );
			const testBlockBItem = items.find( ( item ) => item.id === 'core/test-block-b' );
			expect( testBlockBItem.utility ).toBe( INSERTER_UTILITY_LOW );
		} );

		it( 'should give used blocks a medium utility and set a frecency', () => {
			const state = {
				editor: {
					present: {
						blocksByClientId: {},
						blockOrder: {},
						edits: {},
					},
				},
				reusableBlocks: {
					data: {},
				},
				currentPost: {},
				preferences: {
					insertUsage: {
						'core/test-block-b': { count: 10, time: 1000 },
					},
				},
				blockListSettings: {},
				settings: {},
			};
			const items = getInserterItems( state );
			const reusableBlock2Item = items.find( ( item ) => item.id === 'core/test-block-b' );
			expect( reusableBlock2Item.utility ).toBe( INSERTER_UTILITY_MEDIUM );
			expect( reusableBlock2Item.frecency ).toBe( 2.5 );
		} );

		it( 'should give contextual blocks a high utility', () => {
			const state = {
				editor: {
					present: {
						blocksByClientId: {
							block1: { name: 'core/test-block-b' },
						},
						blockOrder: {
							'': [ 'block1' ],
						},
						edits: {},
					},
				},
				reusableBlocks: {
					data: {},
				},
				currentPost: {},
				preferences: {
					insertUsage: {},
				},
				blockListSettings: {},
				settings: {},
			};
			const items = getInserterItems( state, 'block1' );
			const testBlockCItem = items.find( ( item ) => item.id === 'core/test-block-c' );
			expect( testBlockCItem.utility ).toBe( INSERTER_UTILITY_HIGH );
		} );
	} );

	describe( 'getReusableBlock', () => {
		it( 'should return a reusable block', () => {
			const state = {
				reusableBlocks: {
					data: {
						8109: {
							clientId: 'foo',
							title: 'My cool block',
						},
					},
				},
			};

			const actualReusableBlock = getReusableBlock( state, 8109 );
			expect( actualReusableBlock ).toEqual( {
				id: 8109,
				isTemporary: false,
				clientId: 'foo',
				title: 'My cool block',
			} );
		} );

		it( 'should return a temporary reusable block', () => {
			const state = {
				reusableBlocks: {
					data: {
						reusable1: {
							clientId: 'foo',
							title: 'My cool block',
						},
					},
				},
			};

			const actualReusableBlock = getReusableBlock( state, 'reusable1' );
			expect( actualReusableBlock ).toEqual( {
				id: 'reusable1',
				isTemporary: true,
				clientId: 'foo',
				title: 'My cool block',
			} );
		} );

		it( 'should return null when no reusable block exists', () => {
			const state = {
				reusableBlocks: {
					data: {},
				},
			};

			const reusableBlock = getReusableBlock( state, 123 );
			expect( reusableBlock ).toBeNull();
		} );
	} );

	describe( 'isSavingReusableBlock', () => {
		it( 'should return false when the block is not being saved', () => {
			const state = {
				reusableBlocks: {
					isSaving: {},
				},
			};

			const isSaving = isSavingReusableBlock( state, 5187 );
			expect( isSaving ).toBe( false );
		} );

		it( 'should return true when the block is being saved', () => {
			const state = {
				reusableBlocks: {
					isSaving: {
						5187: true,
					},
				},
			};

			const isSaving = isSavingReusableBlock( state, 5187 );
			expect( isSaving ).toBe( true );
		} );
	} );

	describe( 'isPublishSidebarEnabled', () => {
		it( 'should return the value on state if it is thruthy', () => {
			const state = {
				preferences: {
					isPublishSidebarEnabled: true,
				},
			};
			expect( isPublishSidebarEnabled( state ) ).toBe( state.preferences.isPublishSidebarEnabled );
		} );

		it( 'should return the value on state if it is falsy', () => {
			const state = {
				preferences: {
					isPublishSidebarEnabled: false,
				},
			};
			expect( isPublishSidebarEnabled( state ) ).toBe( state.preferences.isPublishSidebarEnabled );
		} );

		it( 'should return the default value if there is no isPublishSidebarEnabled key on state', () => {
			const state = {
				preferences: { },
			};
			expect( isPublishSidebarEnabled( state ) ).toBe( PREFERENCES_DEFAULTS.isPublishSidebarEnabled );
		} );
	} );

	describe( 'isFetchingReusableBlock', () => {
		it( 'should return false when the block is not being fetched', () => {
			const state = {
				reusableBlocks: {
					isFetching: {},
				},
			};

			const isFetching = isFetchingReusableBlock( state, 5187 );
			expect( isFetching ).toBe( false );
		} );

		it( 'should return true when the block is being fetched', () => {
			const state = {
				reusableBlocks: {
					isFetching: {
						5187: true,
					},
				},
			};

			const isFetching = isFetchingReusableBlock( state, 5187 );
			expect( isFetching ).toBe( true );
		} );
	} );

	describe( 'getReusableBlocks', () => {
		it( 'should return an array of reusable blocks', () => {
			const state = {
				reusableBlocks: {
					data: {
						123: { clientId: 'carrot' },
						reusable1: { clientId: 'broccoli' },
					},
				},
			};

			const reusableBlocks = getReusableBlocks( state );
			expect( reusableBlocks ).toEqual( [
				{ id: 123, isTemporary: false, clientId: 'carrot' },
				{ id: 'reusable1', isTemporary: true, clientId: 'broccoli' },
			] );
		} );

		it( 'should return an empty array when no reusable blocks exist', () => {
			const state = {
				reusableBlocks: {
					data: {},
				},
			};

			const reusableBlocks = getReusableBlocks( state );
			expect( reusableBlocks ).toEqual( [] );
		} );
	} );

	describe( 'getStateBeforeOptimisticTransaction', () => {
		it( 'should return null if no transaction can be found', () => {
			const beforeState = getStateBeforeOptimisticTransaction( {
				optimist: [],
			}, 'foo' );

			expect( beforeState ).toBe( null );
		} );

		it( 'should return null if a transaction with ID can be found, but lacks before state', () => {
			const beforeState = getStateBeforeOptimisticTransaction( {
				optimist: [
					{
						action: {
							optimist: {
								id: 'foo',
							},
						},
					},
				],
			}, 'foo' );

			expect( beforeState ).toBe( null );
		} );

		it( 'should return the before state matching the given transaction id', () => {
			const expectedBeforeState = {};
			const beforeState = getStateBeforeOptimisticTransaction( {
				optimist: [
					{
						beforeState: expectedBeforeState,
						action: {
							optimist: {
								id: 'foo',
							},
						},
					},
				],
			}, 'foo' );

			expect( beforeState ).toBe( expectedBeforeState );
		} );
	} );

	describe( 'isPublishingPost', () => {
		it( 'should return false if the post is not being saved', () => {
			const isPublishing = isPublishingPost( {
				optimist: [],
				saving: {
					requesting: false,
				},
				editor: {
					edits: {},
				},
				currentPost: {
					status: 'publish',
				},
			} );

			expect( isPublishing ).toBe( false );
		} );

		it( 'should return false if the current post is not considered published', () => {
			const isPublishing = isPublishingPost( {
				optimist: [],
				saving: {
					requesting: true,
				},
				editor: {
					edits: {},
				},
				currentPost: {
					status: 'draft',
				},
			} );

			expect( isPublishing ).toBe( false );
		} );

		it( 'should return false if the optimistic transaction cannot be found', () => {
			const isPublishing = isPublishingPost( {
				optimist: [],
				saving: {
					requesting: true,
				},
				editor: {
					edits: {},
				},
				currentPost: {
					status: 'publish',
				},
			} );

			expect( isPublishing ).toBe( false );
		} );

		it( 'should return false if the current post prior to request was already published', () => {
			const isPublishing = isPublishingPost( {
				optimist: [
					{
						beforeState: {
							saving: {
								requesting: false,
							},
							editor: {
								edits: {},
							},
							currentPost: {
								status: 'publish',
							},
						},
						action: {
							optimist: {
								id: POST_UPDATE_TRANSACTION_ID,
							},
						},
					},
				],
				saving: {
					requesting: true,
				},
				editor: {
					edits: {},
				},
				currentPost: {
					status: 'publish',
				},
			} );

			expect( isPublishing ).toBe( false );
		} );

		it( 'should return true if the current post prior to request was not published', () => {
			const isPublishing = isPublishingPost( {
				optimist: [
					{
						beforeState: {
							saving: {
								requesting: false,
							},
							editor: {
								edits: {
									status: 'publish',
								},
							},
							currentPost: {
								status: 'draft',
							},
						},
						action: {
							optimist: {
								id: POST_UPDATE_TRANSACTION_ID,
							},
						},
					},
				],
				saving: {
					requesting: true,
				},
				editor: {
					edits: {},
				},
				currentPost: {
					status: 'publish',
				},
			} );

			expect( isPublishing ).toBe( true );
		} );
	} );

	describe( 'isValidTemplate', () => {
		it( 'should return true if template is valid', () => {
			const state = {
				template: { isValid: true },
			};

			expect( isValidTemplate( state ) ).toBe( true );
		} );

		it( 'should return false if template is not valid', () => {
			const state = {
				template: { isValid: false },
			};

			expect( isValidTemplate( state ) ).toBe( false );
		} );
	} );

	describe( 'getTemplate', () => {
		it( 'should return the template object', () => {
			const template = [];
			const state = {
				settings: { template },
			};

			expect( getTemplate( state ) ).toBe( template );
		} );
	} );

	describe( 'getTemplateLock', () => {
		it( 'should return the general template lock if no clientId was set', () => {
			const state = {
				settings: { templateLock: 'all' },
			};

			expect( getTemplateLock( state ) ).toBe( 'all' );
		} );

		it( 'should return null if the specified clientId was not found ', () => {
			const state = {
				settings: { templateLock: 'all' },
				blockListSettings: {
					chicken: {
						templateLock: 'insert',
					},
				},
			};

			expect( getTemplateLock( state, 'ribs' ) ).toBe( null );
		} );

		it( 'should return null if template lock was not set on the specified block', () => {
			const state = {
				settings: { templateLock: 'all' },
				blockListSettings: {
					chicken: {
						test: 'tes1t',
					},
				},
			};

			expect( getTemplateLock( state, 'ribs' ) ).toBe( null );
		} );

		it( 'should return the template lock for the specified clientId', () => {
			const state = {
				settings: { templateLock: 'all' },
				blockListSettings: {
					chicken: {
						templateLock: 'insert',
					},
				},
			};

			expect( getTemplateLock( state, 'chicken' ) ).toBe( 'insert' );
		} );
	} );

	describe( 'isPermalinkEditable', () => {
		it( 'should be false if there is no permalink', () => {
			const state = {
				currentPost: { permalink_template: '' },
				editor: {
					present: {
						edits: {},
					},
				},
			};

			expect( isPermalinkEditable( state ) ).toBe( false );
		} );

		it( 'should be false if the permalink is not of an editable kind', () => {
			const state = {
				currentPost: { permalink_template: 'http://foo.test/bar/%baz%/' },
				editor: {
					present: {
						edits: {},
					},
				},
			};

			expect( isPermalinkEditable( state ) ).toBe( false );
		} );

		it( 'should be true if the permalink has %postname%', () => {
			const state = {
				currentPost: { permalink_template: 'http://foo.test/bar/%postname%/' },
				editor: {
					present: {
						edits: {},
					},
				},
			};

			expect( isPermalinkEditable( state ) ).toBe( true );
		} );

		it( 'should be true if the permalink has %pagename%', () => {
			const state = {
				currentPost: { permalink_template: 'http://foo.test/bar/%pagename%/' },
				editor: {
					present: {
						edits: {},
					},
				},
			};

			expect( isPermalinkEditable( state ) ).toBe( true );
		} );
	} );

	describe( 'getPermalink', () => {
		it( 'should work if the permalink is not of an editable kind', () => {
			const url = 'http://foo.test/?post=1';
			const state = {
				currentPost: { permalink_template: url },
				editor: {
					present: {
						edits: {},
					},
				},
			};

			expect( getPermalink( state ) ).toBe( url );
		} );

		it( 'should return the permalink if it is editable', () => {
			const state = {
				currentPost: {
					permalink_template: 'http://foo.test/bar/%postname%/',
					slug: 'baz',
				},
				editor: {
					present: {
						edits: {},
					},
				},
			};

			expect( getPermalink( state ) ).toBe( 'http://foo.test/bar/baz/' );
		} );
	} );

	describe( 'getPermalinkParts', () => {
		it( 'should split the permalink correctly', () => {
			const parts = {
				prefix: 'http://foo.test/bar/',
				postName: 'baz',
				suffix: '/',
			};
			const state = {
				currentPost: {
					permalink_template: 'http://foo.test/bar/%postname%/',
					slug: 'baz',
				},
				editor: {
					present: {
						edits: {},
					},
				},
			};

			expect( getPermalinkParts( state ) ).toEqual( parts );
		} );

		it( 'should leave an uneditable permalink in the prefix', () => {
			const parts = {
				prefix: 'http://foo.test/?post=1',
				postName: 'baz',
			};
			const state = {
				currentPost: {
					permalink_template: 'http://foo.test/?post=1',
					slug: 'baz',
				},
				editor: {
					present: {
						edits: {},
					},
				},
			};

			expect( getPermalinkParts( state ) ).toEqual( parts );
		} );
	} );

	describe( 'getBlockListSettings', () => {
		it( 'should return the settings of a block', () => {
			const state = {
				blockListSettings: {
					chicken: {
						setting1: false,
					},
					ribs: {
						setting2: true,
					},
				},
			};

			expect( getBlockListSettings( state, 'chicken' ) ).toEqual( {
				setting1: false,
			} );
		} );

		it( 'should return undefined if settings for the block don’t exist', () => {
			const state = {
				blockListSettings: {},
			};

			expect( getBlockListSettings( state, 'chicken' ) ).toBe( undefined );
		} );
	} );

	describe( 'canUserUseUnfilteredHTML', () => {
		it( 'should return true if the _links object contains the property wp:action-unfiltered_html', () => {
			const state = {
				currentPost: {
					_links: {
						'wp:action-unfiltered_html': [],
					},
				},
			};
			expect( canUserUseUnfilteredHTML( state ) ).toBe( true );
		} );
		it( 'should return false if the _links object doesnt contain the property wp:action-unfiltered_html', () => {
			const state = {
				currentPost: {
					_links: {},
				},
			};
			expect( canUserUseUnfilteredHTML( state ) ).toBe( false );
		} );
	} );
} );

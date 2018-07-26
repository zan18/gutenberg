/**
 * Internal dependencies
 */
import deprecated from './deprecated';

// Components
// eslint-disable-next-line camelcase
export { default as APIProvider, unstable__setApiSettings } from './higher-order/with-api-data/provider';
export { default as Autocomplete } from './autocomplete';
export { default as BaseControl } from './base-control';
export { default as Button } from './button';
export { default as ButtonGroup } from './button-group';
export { default as CheckboxControl } from './checkbox-control';
export { default as ClipboardButton } from './clipboard-button';
export { default as ColorPalette } from './color-palette';
export { default as Dashicon } from './dashicon';
export { DateTimePicker, DatePicker, TimePicker } from './date-time';
export { default as Disabled } from './disabled';
export { default as Draggable } from './draggable';
export { default as DropZone } from './drop-zone';
export { default as DropZoneProvider } from './drop-zone/provider';
export { default as Dropdown } from './dropdown';
export { default as DropdownMenu } from './dropdown-menu';
export { default as ExternalLink } from './external-link';
export { default as FocusableIframe } from './focusable-iframe';
export { default as FontSizePicker } from './font-size-picker';
export { default as FormFileUpload } from './form-file-upload';
export { default as FormToggle } from './form-toggle';
export { default as FormTokenField } from './form-token-field';
export { default as IconButton } from './icon-button';
export { default as KeyboardShortcuts } from './keyboard-shortcuts';
export { default as MenuGroup } from './menu-group';
export { default as MenuItem } from './menu-item';
export { default as MenuItemsChoice } from './menu-items-choice';
export { default as Modal } from './modal';
export { default as ScrollLock } from './scroll-lock';
export { NavigableMenu, TabbableContainer } from './navigable-container';
export { default as Notice } from './notice';
export { default as NoticeList } from './notice/list';
export { default as Panel } from './panel';
export { default as PanelBody } from './panel/body';
export { default as PanelColor } from './panel/color';
export { default as PanelHeader } from './panel/header';
export { default as PanelRow } from './panel/row';
export { default as Placeholder } from './placeholder';
export { default as Popover } from './popover';
export { default as QueryControls } from './query-controls';
export { default as RadioControl } from './radio-control';
export { default as RangeControl } from './range-control';
export { default as ResponsiveWrapper } from './responsive-wrapper';
export { default as SandBox } from './sandbox';
export { default as SelectControl } from './select-control';
export { default as Spinner } from './spinner';
export { default as ServerSideRender } from './server-side-render';
export { default as TabPanel } from './tab-panel';
export { default as TextControl } from './text-control';
export { default as TextareaControl } from './textarea-control';
export { default as ToggleControl } from './toggle-control';
export { default as Toolbar } from './toolbar';
export { default as Tooltip } from './tooltip';
export { default as TreeSelect } from './tree-select';
export { createSlotFill, Slot, Fill, Provider as SlotFillProvider } from './slot-fill';

// Higher-Order Components
export { default as navigateRegions } from './higher-order/navigate-regions';
export { default as withAPIData } from './higher-order/with-api-data';
export { default as withContext } from './higher-order/with-context';
export { default as withConstrainedTabbing } from './higher-order/with-constrained-tabbing';
export { default as withFallbackStyles } from './higher-order/with-fallback-styles';
export { default as withFilters } from './higher-order/with-filters';
export { default as withFocusOutside } from './higher-order/with-focus-outside';
export { default as withFocusReturn } from './higher-order/with-focus-return';
export { default as withNotices } from './higher-order/with-notices';
export { default as withSpokenMessages } from './higher-order/with-spoken-messages';

export const ifCondition = deprecated.ifCondition;
export const withGlobalEvents = deprecated.withGlobalEvents;
export const withInstanceId = deprecated.withInstanceId;
export const withSafeTimeout = deprecated.withSafeTimeout;
export const withState = deprecated.withState;
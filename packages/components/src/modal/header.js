/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies.
 */
import IconButton from '../icon-button';

const ModalHeader = ( { icon, title, onClose, closeLabel, headingId, showCloseIcon } ) => {
	const label = closeLabel ? closeLabel : __( 'Close dialog' );

	return (
		<div
			className="components-modal__header"
		>
			<div className="components-modal__header-heading-container">
				{ icon &&
					<span className="components-modal__icon-container" aria-hidden>
						{ icon && <img alt={ __( 'User avatar' ) } src={ icon } /> }
					</span>
				}
				{ title &&
					<h1 id={ headingId }
						className="components-modal__header-heading">
						{ title }
					</h1>
				}
			</div>
			{ showCloseIcon &&
				<IconButton
					onClick={ onClose }
					icon="no-alt"
					label={ label }
				/>
			}
		</div>
	);
};

export default ModalHeader;

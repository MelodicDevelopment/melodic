import { css } from '@melodicdev/core';

export const dialogStyles = () => css`
	:host {
		dialog {
		}

		dialog div.ml-dialog-header:not(:::slotted(*)) {
			display: none;
		}

		dialog div.ml-dialog-footer:not(:::slotted(*)) {
			display: none;
		}
	}
`;

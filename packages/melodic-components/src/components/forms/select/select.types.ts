export interface SelectOption {
	/** Unique value for the option */
	value: string;

	/** Display label */
	label: string;

	/** Optional icon name (Phosphor icon) */
	icon?: string;

	/** Whether the option is disabled */
	disabled?: boolean;
}

// Base interfaces for items
export interface BaseItem {
	id: string | number;
	name: string;
	category: string;
}

// Common table cell props
export interface EditableCellProps {
	value: string | number;
	onChange: (value: string) => void;
	suffix?: string;
	prefix?: string;
	originalValue?: string | number;
	highlightChanges?: boolean;
}

// Common section props
export interface BaseSectionProps {
	tag: string;
	tagIndex: number;
	previewVersion: string | boolean;
	highlightChanges?: boolean;
}

// Common grouped data interface
export interface GroupedData<T> {
	[tag: string]: T[];
}

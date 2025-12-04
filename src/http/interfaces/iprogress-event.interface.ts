export interface IProgressEvent {
	loaded: number;
	total: number;
	percentage: number;
	phase: 'upload' | 'download';
}

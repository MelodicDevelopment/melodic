import { MelodicComponent } from '../../../../src/components';
import '../../../../packages/melodic-components/src/components/forms/file-upload/file-icon.component';
import '../../../../packages/melodic-components/src/components/forms/file-upload/file-upload.component';
import '../../../../packages/melodic-components/src/components/forms/file-upload/file-upload-item.component';
import { fileUploadDemoTemplate } from './file-upload-demo.template';
import { fileUploadDemoStyles } from './file-upload-demo.styles';
import type { FileUploadStatus } from '../../../../packages/melodic-components/src/components/forms/file-upload/file-upload.types';

interface DemoFileItem {
	name: string;
	size: string;
	status: FileUploadStatus;
	progress: number;
	error: string;
}

@MelodicComponent({
	selector: 'file-upload-demo',
	template: fileUploadDemoTemplate,
	styles: fileUploadDemoStyles
})
export class FileUploadDemoComponent {
	files: DemoFileItem[] = [];

	handleFilesSelected = (event: CustomEvent): void => {
		const selectedFiles = event.detail.files as File[];
		for (const file of selectedFiles) {
			const item: DemoFileItem = {
				name: file.name,
				size: this._formatSize(file.size),
				status: 'uploading',
				progress: 0,
				error: ''
			};
			this.files = [...this.files, item];
			this._simulateUpload(this.files.length - 1);
		}
	};

	handleFileError = (event: CustomEvent): void => {
		console.warn('File validation errors:', event.detail.errors);
	};

	handleRemove = (event: CustomEvent): void => {
		const name = event.detail.name;
		this.files = this.files.filter(f => f.name !== name);
	};

	handleRetry = (event: CustomEvent): void => {
		const name = event.detail.name;
		const idx = this.files.findIndex(f => f.name === name);
		if (idx >= 0) {
			this.files = this.files.map((f, i) =>
				i === idx ? { ...f, status: 'uploading' as FileUploadStatus, progress: 0, error: '' } : f
			);
			this._simulateUpload(idx);
		}
	};

	_simulateUpload(index: number): void {
		let progress = 0;
		const interval = setInterval(() => {
			progress += Math.random() * 15 + 5;
			if (progress >= 100) {
				progress = 100;
				clearInterval(interval);
				this.files = this.files.map((f, i) =>
					i === index ? { ...f, progress: 100, status: 'complete' as FileUploadStatus } : f
				);
			} else {
				this.files = this.files.map((f, i) =>
					i === index ? { ...f, progress: Math.round(progress) } : f
				);
			}
		}, 300);
	}

	_formatSize(bytes: number): string {
		if (bytes < 1024) return `${bytes} B`;
		if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
		return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
	}
}

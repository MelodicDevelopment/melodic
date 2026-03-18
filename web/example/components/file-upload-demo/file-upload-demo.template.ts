import { html } from '../../../../src/template/functions/html.function';
import { repeat } from '../../../../src/template/directives';
import type { FileUploadDemoComponent } from './file-upload-demo.component';

export function fileUploadDemoTemplate(c: FileUploadDemoComponent) {
	return html`
		<div class="file-upload-demo">
			<h2>File Upload</h2>
			<p class="description">Drag-and-drop file upload with progress tracking and file type icons.</p>

			<div class="demo-section">
				<h3>Dropzone</h3>
				<ml-file-upload
					label="Click to upload"
					sublabel="or drag and drop"
					hint="SVG, PNG, JPG, GIF or PDF (max. 10MB)"
					accept=".svg,.png,.jpg,.jpeg,.gif,.pdf"
					multiple
					max-size="10485760"
					@ml:change=${c.handleFilesSelected}
					@ml:error=${c.handleFileError}
				></ml-file-upload>
			</div>

			${c.files.length > 0 ? html`
				<div class="demo-section">
					<h3>Uploaded Files</h3>
					<div class="file-list">
						${repeat(
							c.files,
							(f) => f.name,
							(f) => html`
								<ml-file-upload-item
									name=${f.name}
									size=${f.size}
									status=${f.status}
									progress=${f.progress}
									error=${f.error}
									@ml:remove=${c.handleRemove}
									@ml:retry=${c.handleRetry}
								></ml-file-upload-item>
							`
						)}
					</div>
				</div>
			` : ''}

			<div class="demo-section">
				<h3>File Items (Static States)</h3>
				<div class="file-list">
					<ml-file-upload-item name="design-mockup.pdf" size="2.4 MB" status="idle"></ml-file-upload-item>
					<ml-file-upload-item name="screenshot.png" size="4.1 MB" status="uploading" progress="50"></ml-file-upload-item>
					<ml-file-upload-item name="brand-guidelines.pdf" size="1.8 MB" status="complete" progress="100"></ml-file-upload-item>
					<ml-file-upload-item name="video-intro.mp4" size="16.2 MB" status="error" error="File size exceeds limit"></ml-file-upload-item>
				</div>
			</div>

			<div class="demo-section">
				<h3>File Icons</h3>
				<div class="icon-row">
					<ml-file-icon extension="pdf" size="lg"></ml-file-icon>
					<ml-file-icon extension="png" size="lg"></ml-file-icon>
					<ml-file-icon extension="mp4" size="lg"></ml-file-icon>
					<ml-file-icon extension="mp3" size="lg"></ml-file-icon>
					<ml-file-icon extension="zip" size="lg"></ml-file-icon>
					<ml-file-icon extension="doc" size="lg"></ml-file-icon>
					<ml-file-icon extension="xls" size="lg"></ml-file-icon>
					<ml-file-icon extension="txt" size="lg"></ml-file-icon>
				</div>
			</div>

			<div class="demo-section">
				<h3>Disabled Dropzone</h3>
				<ml-file-upload
					label="Click to upload"
					sublabel="or drag and drop"
					disabled
				></ml-file-upload>
			</div>
		</div>
	`;
}

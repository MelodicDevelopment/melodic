// Original modal component (for declarative use)
export { MlModal } from './modal.component';
export { modalTemplate } from './modal.template';
export { modalStyles } from './modal.styles';

// Modal service (for programmatic use)
export { modalService } from './modal.service';
export type { ModalOpenConfig } from './modal.service';

// Modal reference
export { ModalRef } from './modal-ref';

// Modal host (internal, but exported for registration)
export { MlModalHost } from './modal-host.component';
export { modalHostTemplate } from './modal-host.template';
export { modalHostStyles } from './modal-host.styles';

// Modal content interface
export type { ModalContent, ModalContentConstructor } from './modal-content';

// Injection tokens (for DI-based access)
export { MODAL_REF, MODAL_DATA } from './modal-tokens';

// Types
export type { ModalSize, ModalHeaderLayout, ModalHeaderAlign, ModalConfig } from './modal.types';

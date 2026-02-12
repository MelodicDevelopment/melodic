import { html, classMap, when } from '@melodicdev/core';
import type { SidebarItemComponent } from './sidebar-item.component.js';

export function sidebarItemTemplate(c: SidebarItemComponent) {
	const level = parseInt(c.level, 10) || 0;
	const isCollapsed = c.collapsed;

	const content = html`
		<div class="ml-sidebar-item__leading">
			<slot name="leading">
				${when(!!c.icon, () => html`<ml-icon icon=${c.icon} size="sm"></ml-icon>`)}
			</slot>
		</div>
		${when(!isCollapsed, () => html`
			<span class="ml-sidebar-item__label">${c.label}</span>
			<div class="ml-sidebar-item__trailing">
				<slot name="trailing">
					${when(!!c.badge, () => html`
						<span class=${classMap({
							'ml-sidebar-item__badge': true,
							[`ml-sidebar-item__badge--${c['badge-color']}`]: true
						})}>${c.badge}</span>
					`)}
					${when(c.external, () => html`<ml-icon icon="arrow-square-out" size="xs"></ml-icon>`)}
				</slot>
				${when(c.hasChildren, () => html`
					<ml-icon
						class="ml-sidebar-item__chevron"
						icon="caret-right"
						size="xs"
					></ml-icon>
				`)}
			</div>
		`)}
	`;

	const linkClasses = classMap({
		'ml-sidebar-item__link': true,
		'ml-sidebar-item__link--active': c.active,
		'ml-sidebar-item__link--disabled': c.disabled,
		'ml-sidebar-item__link--expanded': c.expanded,
		'ml-sidebar-item__link--collapsed': isCollapsed,
		'ml-sidebar-item__link--has-children': c.hasChildren
	});

	return html`
		<div class="ml-sidebar-item" style="--level: ${level}">
			${when(
				!!c.href && !c.hasChildren,
				() => html`
					<a
						class=${linkClasses}
						href=${c.href}
						?target=${c.external ? '_blank' : null}
						?rel=${c.external ? 'noopener noreferrer' : null}
						@click=${c.handleClick}
					>
						${content}
					</a>
				`,
				() => html`
					<button
						type="button"
						class=${linkClasses}
						?disabled=${c.disabled}
						@click=${c.handleClick}
					>
						${content}
					</button>
				`
			)}
			${when(c.hasChildren && c.expanded && !isCollapsed, () => html`
				<div class="ml-sidebar-item__submenu">
					<slot @slotchange=${c.handleSlotChange}></slot>
				</div>
			`)}
			${when(!c.hasChildren || !c.expanded || isCollapsed, () => html`
				<div style="display: none">
					<slot @slotchange=${c.handleSlotChange}></slot>
				</div>
			`)}
		</div>
	`;
}

import { html, classMap, repeat, when } from '@melodicdev/core';
import type { TemplateResult } from '@melodicdev/core';
import type { SidebarComponent } from './sidebar.component.js';
import type { SidebarNavGroup, SidebarNavItem } from './sidebar.types.js';

export function sidebarTemplate(c: SidebarComponent) {
	const hasNavConfig = c.navigation.length > 0;
	const hasFooterConfig = c.footerNavigation.length > 0;
	const isCollapsed = c.collapsed;

	return html`
		<aside
			class=${classMap({
				'ml-sidebar': true,
				[`ml-sidebar--${c.variant}`]: true,
				'ml-sidebar--collapsed': isCollapsed
			})}
			role="navigation"
			@keydown=${c.handleKeyDown}
		>
			<div class="ml-sidebar__header">
				<slot name="header"></slot>
			</div>

			${when(c.hasSearch && !isCollapsed, () => html`
				<div class="ml-sidebar__search">
					<slot name="search"></slot>
				</div>
			`)}

			<div class="ml-sidebar__main">
				${hasNavConfig
					? repeat(
							c.navigation,
							(_group, index) => `nav-group-${index}`,
							(group) => renderNavGroup(c, group)
						)
					: html`<slot @slotchange=${c.handleDefaultSlotChange}></slot>`}
			</div>

			<div class="ml-sidebar__footer">
				${hasFooterConfig
					? html`
						<div class="ml-sidebar__footer-nav">
							${repeat(
								c.footerNavigation,
								(item) => item.value,
								(item) => renderNavItem(c, item, 0)
							)}
						</div>
					`
					: html`
						<div class="ml-sidebar__footer-nav">
							<slot name="footer-nav"></slot>
						</div>
					`}

				${when(c.hasFeature && !isCollapsed, () => html`
					<div class="ml-sidebar__feature">
						<slot name="feature"></slot>
					</div>
				`)}

				${when(c.hasUser, () => html`
					<div class="ml-sidebar__user">
						<slot name="user"></slot>
					</div>
				`)}
			</div>
		</aside>
	`;
}

function renderNavGroup(c: SidebarComponent, group: SidebarNavGroup) {
	const isCollapsed = c.collapsed;

	return html`
		<div class="ml-sidebar__group">
			${when(!!group.label && !isCollapsed, () => html`
				<span class="ml-sidebar__group-label">${group.label}</span>
			`)}
			<div class="ml-sidebar__group-items">
				${repeat(
					group.items,
					(item) => item.value,
					(item) => renderNavItem(c, item, 0)
				)}
			</div>
		</div>
	`;
}

function renderNavItem(c: SidebarComponent, item: SidebarNavItem, level: number): TemplateResult {
	const isActive = c.active === item.value;
	const hasChildren = !!item.children && item.children.length > 0;
	const isExpanded = c.expandedItems.has(item.value);
	const isCollapsed = c.collapsed;

	const linkClasses = classMap({
		'ml-sidebar__item-link': true,
		'ml-sidebar__item-link--active': isActive,
		'ml-sidebar__item-link--disabled': !!item.disabled,
		'ml-sidebar__item-link--expanded': isExpanded,
		'ml-sidebar__item-link--collapsed': isCollapsed,
		'ml-sidebar__item-link--has-children': hasChildren
	});

	const handleClick = (event: Event) => {
		if (item.disabled) return;
		if (hasChildren) {
			event.preventDefault();
			c.handleConfigToggle(item);
			return;
		}
		c.handleConfigItemClick(item.value, item.href);
	};

	const content = html`
		<div class="ml-sidebar__item-leading">
			${when(!!item.icon, () => html`<ml-icon icon=${item.icon} size="sm"></ml-icon>`)}
		</div>
		${when(!isCollapsed, () => html`
			<span class="ml-sidebar__item-label">${item.label}</span>
			<div class="ml-sidebar__item-trailing">
				${when(!!item.badge, () => html`
					<span class=${classMap({
						'ml-sidebar__item-badge': true,
						[`ml-sidebar__item-badge--${item.badgeColor || 'default'}`]: true
					})}>${item.badge}</span>
				`)}
				${when(!!item.external, () => html`<ml-icon icon="arrow-square-out" size="xs"></ml-icon>`)}
				${when(hasChildren, () => html`
					<ml-icon
						class="ml-sidebar__item-chevron"
						icon="caret-right"
						size="xs"
					></ml-icon>
				`)}
			</div>
		`)}
	`;

	return html`
		<div class="ml-sidebar__item" style="--level: ${level}">
			${when(
				!!item.href && !hasChildren,
				() => html`
					<a
						class=${linkClasses}
						href=${item.href}
						?target=${item.external ? '_blank' : null}
						?rel=${item.external ? 'noopener noreferrer' : null}
						@click=${handleClick}
					>
						${content}
					</a>
				`,
				() => html`
					<button
						type="button"
						class=${linkClasses}
						?disabled=${item.disabled}
						@click=${handleClick}
					>
						${content}
					</button>
				`
			)}
			${when(hasChildren && isExpanded && !isCollapsed, () => html`
				<div class="ml-sidebar__item-submenu">
					${repeat(
						item.children!,
						(child) => child.value,
						(child) => renderNavItem(c, child, level + 1)
					)}
				</div>
			`)}
		</div>
	`;
}

export type GlobalTheme = 'company' | 'framework';

const baseFonts = "@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600;9..144,700&family=Manrope:wght@300..800&display=swap');";

export function injectGlobalStyles(theme: GlobalTheme): void {
	const style = document.createElement('style');
	const background = theme === 'framework'
		? 'linear-gradient(180deg, rgba(0, 157, 217, 0.08) 0%, rgba(246, 251, 255, 1) 45%)'
		: 'linear-gradient(180deg, rgba(255, 0, 130, 0.08) 0%, rgba(247, 244, 251, 1) 45%)';

	style.textContent = `
${baseFonts}
:root {
	color-scheme: light;
	--md-pink: #ff0082;
	--md-purple: #49216d;
	--md-blue: #009dd9;
	--md-ink: #100a1f;
	--md-ink-soft: #2a2140;
	--md-ink-fade: #5a4d73;
	--md-cream: #f7f4fb;
	--md-surface: #ffffff;
	--md-border: rgba(73, 33, 109, 0.16);
	--md-shadow: 0 24px 60px rgba(16, 10, 31, 0.16);
	--md-shadow-soft: 0 18px 40px rgba(16, 10, 31, 0.1);
	--md-radius-lg: 28px;
	--md-radius-md: 18px;
	--md-radius-sm: 12px;
	--md-font-display: 'Fraunces', 'Iowan Old Style', serif;
	--md-font-body: 'Manrope', 'Avenir Next', sans-serif;
}
* {
	box-sizing: border-box;
}
body {
	margin: 0;
	background: ${background};
	color: var(--md-ink);
	font-family: var(--md-font-body);
	min-height: 100vh;
}
img {
	max-width: 100%;
	display: block;
}
a {
	color: inherit;
	text-decoration: none;
}
`;

	document.head.appendChild(style);
}

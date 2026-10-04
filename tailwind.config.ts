import type { Config } from 'tailwindcss';
export default { content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'], theme: { extend: { colors: { charcoal:'#20231F', cream:'#F7F3EB', gold:'#B89047' }, fontFamily:{ sans:['Inter','sans-serif'], serif:['Georgia','serif'] } } }, plugins: [] } satisfies Config;

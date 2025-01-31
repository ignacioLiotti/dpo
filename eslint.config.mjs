import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";
import reactCompiler from "eslint-plugin-react-compiler";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
	baseDirectory: __dirname,
});

const eslintConfig = [
	...compat.extends("next/core-web-vitals", "next/typescript"),
	{
		plugins: {
			"react-compiler": reactCompiler,
		},
		rules: {
			"react-compiler/react-compiler": "error",
			"no-unused-vars": "off",
			"@typescript-eslint/no-unused-vars": "off",
			"@typescript-eslint/no-empty-interface": "off",
			"@typescript-eslint/no-empty-object-type": "off",
			"@typescript-eslint/no-explicit-any": "off",
			"react-hooks/exhaustive-deps": "off",
			"react/jsx-no-undef": "off",
			"react/no-unescaped-entities": "off",
			"react-compiler/react-compiler": "off",
			"react/no-unknown-property": "off",
			"react/no-deprecated": "off",
			"react/no-string-refs": "off",
			"react/no-find-dom-node": "off",
			"react/no-danger": "off",
			"react/no-did-mount-set-state": "off",
			"react/no-did-update-set-state": "off",
			"react/no-direct-mutation-state": "off",
			"react/no-is-mounted": "off",
			"react/display-name": "off",
			"@typescript-eslint/ban-ts-comment": "off",
			"@typescript-eslint/no-unsafe-assignment": "off",
			"@typescript-eslint/no-unsafe-call": "off",
			// "@typescript-eslint/no-unsafe-member-access": "off",
			"@typescript-eslint/no-unsafe-return": "off",
			"@typescript-eslint/no-unsafe-argument": "off",
		},
	},
];

export default eslintConfig;

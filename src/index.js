const { join } = require("path");
const { writeFile } = require("fs").promises;
const { generateColorFamily } = require("./functions/generateColorFamily");
const { colors } = require("./colors/colors");

exports.generate = (hex = chroma.random(), referenceColors = colors) =>
	generateColorFamily(hex, referenceColors);

/**
 * @param {Record<string, string>} args
 * @returns {Promise<import("vite").Plugin>}
 */
exports.shades = async (args = {}) => {
	return {
		name: "tailwind-palettes-generator",
		async config(config) {
			let css = ":root {\n";
			let keys = Object.entries(args);
			let [defaultPalette] = keys[0] || [];

			for (const [key, hex] of keys) {
				const shades = generateColorFamily(hex, colors);

				if ( key.substring(0,1) === "_" ) {
					let hexcode = []
					shades.forEach((shade) => {
						hexcode.push(shade.hexcode);
					})
					hexcode.reverse()
					shades.forEach((shade,i) => {
						shade.hexcode = hexcode[i];
					});
				}

				shades.forEach((shade) => {
					css += `\t--${key}-${shade.number}: ${shade.hexcode};\n`;
				});

				css += "\n";

				shades.forEach((shade) => {
					css += `\t--on-${key}-${shade.number}: ${
						shade.luminance < 40 ? `var(--${key}-100)` : `var(--${key}-900)`
					};\n`;
				});

				css += "\n";
			}

			css += "\n}\n\n";

			for (const [key, hex] of keys) {
				const shades = generateColorFamily(hex, colors);

				css += `${key === defaultPalette ? `:root,\n.${key}` : `.${key}`} {\n`;

				shades.forEach((shade) => {
					css += `\t--color-${shade.number}: var(--${key}-${shade.number});\n`;
				});

				css += "\n";

				shades.forEach((shade) => {
					css += `\t--on-color-${shade.number}: var(--on-${key}-${shade.number});\n`;
				});

				css += "}\n\n";
			}

			await writeFile(join(config.root, "src/_palettes.css"), css);
		}
	};
};

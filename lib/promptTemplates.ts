import { PromptTemplate } from './types';

export const DEFAULT_PROMPT_TEMPLATES: PromptTemplate[] = [
  {
    id: 'master-adobe-stock-grid',
    name: 'Adobe Stock 32-Icon Grid (8x4 Master Prompt)',
    description: 'Exact commercial standard: 8x4 Grid layout, bold line vector outline & solid silhouette fill on pure white background.',
    isDefault: true,
    outlineTemplate: `A clean, professional icon set featuring 32 bold outline icons based on the theme of {{THEME}}. The icons are arranged in a perfectly aligned grid layout (8 columns × 4 rows), with equal spacing between each icon. Each icon is centered within its own identical square bounding box, maintaining consistent padding, proportions, and visual weight.

Style: bold line, thick stroke, minimal, modern, professional vector-style icons. Uniform stroke width across all icons, centered stroke alignment, smooth rounded corners, clean geometry, consistent visual language, no broken or overlapping lines.

Composition: pixel-perfect grid system, mathematically equal spacing, consistent margins on all sides. Icons are aligned to a precise grid and do not touch each other or the edges.

Design rules: no fill, outline only, no overlapping elements, no clutter, simplified and highly recognizable shapes, consistent proportions and visual weight.

Background: pure white background, clean and isolated.

Rendering: flat vector-style appearance, clean geometric construction, smooth curves, crisp edges, minimal anchor complexity, optimized for scalability and easy vectorization.

Usability: designed for UI, mobile apps, websites, dashboards, presentations, infographics, packaging, print and commercial graphic design. Highly legible even at small sizes.

Quality: ultra sharp, high resolution, crisp edges, no distortion, no blur, no shadows, no gradients, no textures, no 3D effects, professional commercial stock quality.

STRICT ICON CONTENT:

The icon set must contain exactly these 32 icons:

{{ICON_LIST}}

Do not add, remove, replace, duplicate, or reinterpret any icon from the list.

All 32 icons must belong to the same visual family and maintain identical stroke weight, proportions, corner treatment, spacing and overall design language.`,
    solidTemplate: `A clean, professional icon set featuring 32 solid filled icons based on the theme of {{THEME}}. The icons are arranged in a perfectly aligned grid layout (8 columns × 4 rows), with equal spacing between each icon. Each icon is centered within its own identical square bounding box, maintaining consistent padding, proportions and visual balance.

Style: solid fill, bold, minimal, modern, professional vector-style icons. No outlines or strokes, only filled shapes. Smooth edges, clean geometric construction, consistent visual weight and strong silhouettes.

Composition: pixel-perfect 8 × 4 grid system, mathematically equal spacing, consistent margins on all sides. Icons are aligned precisely and do not touch each other or the edges.

Design rules: fully filled shapes, no stroke, no outline, no gradients, no shadows, no textures, no 3D effects. Clean silhouettes with high recognizability and consistent visual complexity.

Background: pure white background, clean and isolated.

Rendering: flat vector-style appearance, clean geometric shapes, crisp edges, minimal anchor complexity, optimized for scalability and easy vectorization.

Usability: designed for UI, mobile apps, websites, dashboards, presentations, infographics, packaging, print and commercial graphic design. Highly legible even at small sizes.

Quality: ultra sharp, high resolution, crisp edges, no distortion, professional commercial stock quality.

STRICT ICON CONTENT:

Use exactly the same 32 icons listed above:

{{ICON_LIST}}

Do not add, remove, replace or duplicate any icon.

All 32 icons must maintain the same visual family, proportions, spacing and design language.`
  },
  {
    id: 'duotone-modern-grid',
    name: 'Duotone / Modern Two-Tone Style',
    description: 'Modern two-tone styling for premium UI design and presentation graphics.',
    outlineTemplate: `A clean, professional icon set featuring 32 modern two-tone outline icons based on the theme of {{THEME}}. Arranged in an 8x4 grid, equal spacing, centered on pure white background. Minimal, crisp vector look with accent highlights.

STRICT ICON CONTENT:
{{ICON_LIST}}`,
    solidTemplate: `A clean, professional icon set featuring 32 modern solid icons based on the theme of {{THEME}}. Arranged in an 8x4 grid, equal spacing, centered on pure white background. Solid vector silhouettes with clean geometry.

STRICT ICON CONTENT:
{{ICON_LIST}}`
  }
];

export function buildPrompts(
  theme: string,
  icons: string[],
  template: PromptTemplate = DEFAULT_PROMPT_TEMPLATES[0]
): { outlinePrompt: string; solidPrompt: string } {
  const formattedIconList = icons
    .map((icon, idx) => `${idx + 1}. ${icon.trim()}`)
    .join('\n');

  const outlinePrompt = template.outlineTemplate
    .replace(/\{\{THEME\}\}/g, theme)
    .replace(/\{\{ICON_COUNT\}\}/g, icons.length.toString())
    .replace(/\{\{ICON_LIST\}\}/g, formattedIconList);

  const solidPrompt = template.solidTemplate
    .replace(/\{\{THEME\}\}/g, theme)
    .replace(/\{\{ICON_COUNT\}\}/g, icons.length.toString())
    .replace(/\{\{ICON_LIST\}\}/g, formattedIconList);

  return { outlinePrompt, solidPrompt };
}

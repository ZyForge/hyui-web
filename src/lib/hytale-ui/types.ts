/**
 * Hytale UI AST Types
 * Following the syntax described in Hytale_UI_Reference.md
 */

export type PropertyValue = string | number | boolean | null | PropertyValue[] | { [key: string]: PropertyValue };

export interface UIElement {
  id?: string;
  type: string;
  properties: { [key: string]: PropertyValue };
  children: UIElement[];
}

export interface UIVariable {
  name: string;
  value: string;
}

export interface UIDocument {
  imports: { [key: string]: string };
  variables: { [key: string]: any };
  root: UIElement | null;
}

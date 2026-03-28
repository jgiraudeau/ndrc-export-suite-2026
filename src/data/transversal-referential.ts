import { WORDPRESS_COMPETENCIES, PRESTASHOP_COMPETENCIES } from "./competencies";
import E4_DATA from "../../prisma/referentiel_e4.json";
import E6_DATA from "../../prisma/referentiel_e6.json";

export interface TransversalBlock {
  id: string;
  label: string;
  items: Array<{
    id: string;
    label: string;
    block: "E4" | "E5" | "E6";
  }>;
}

// Convert E4/E6 JSON to a flat list for the matrix
const formatReferential = (data: any[], block: "E4" | "E6"): TransversalBlock[] => {
  return data.map(group => ({
    id: group.code,
    label: group.description,
    items: group.children.map((child: any, idx: number) => ({
      id: `${group.code}_${idx}`, // Consistent with current grading ID format
      label: child.description,
      block
    }))
  }));
};

const E4_BLOCKS = formatReferential(E4_DATA, "E4");
const E6_BLOCKS = formatReferential(E6_DATA, "E6");

// For E5 (Digital), we group by Level or platform
const E5_BLOCKS: TransversalBlock[] = [
  {
    id: "E5.WP",
    label: "Bloc Digital : WordPress",
    items: WORDPRESS_COMPETENCIES.map(c => ({
      id: c.id,
      label: c.label,
      block: "E5" as const
    }))
  },
  {
    id: "E5.PS",
    label: "Bloc Digital : PrestaShop",
    items: PRESTASHOP_COMPETENCIES.map(c => ({
      id: c.id,
      label: c.label,
      block: "E5" as const
    }))
  }
];

export const TRANSVERSAL_REFERENTIAL: TransversalBlock[] = [
  ...E4_BLOCKS,
  ...E5_BLOCKS,
  ...E6_BLOCKS
];

/**
 * Utilitaire pour extraire et nettoyer les données des tableaux Markdown
 * Utile pour transformer du texte IA en tableaux PDF (autoTable) ou Word.
 */

export interface MarkdownTable {
    head: string[][];
    body: string[][];
}

export const MarkdownParser = {
    /**
     * Recherche et extrait le premier tableau Markdown d'un bloc de texte
     */
    extractTable: (content: string): MarkdownTable | null => {
        const lines = content.split("\n").map(l => l.trim());
        const tableStartIndex = lines.findIndex(l => l.startsWith("|") && l.includes("|") && !l.includes("---"));
        
        if (tableStartIndex === -1) return null;

        const tableLines: string[] = [];
        for (let i = tableStartIndex; i < lines.length; i++) {
            const line = lines[i];
            if (line.startsWith("|")) {
                tableLines.push(line);
            } else if (tableLines.length > 0) {
                // On s'arrête dès qu'on sort du tableau (ligne vide ou texte sans '|')
                break;
            }
        }

        if (tableLines.length < 3) return null; // Head, separator, at least 1 row

        const parseRow = (row: string) => {
            // Split par pipe, enlève le premier et dernier élément vides (car ligne commence et finit par |)
            const cells = row.split("|");
            return cells
                .slice(1, cells.length - 1)
                .map(c => c.trim());
        };

        // On ignore la ligne de séparation (---)
        const head = [parseRow(tableLines[0])];
        const body = tableLines
            .slice(1) // On enlève le head
            .filter(line => !line.includes("---") && line.trim() !== "") // On enlève la ligne de séparation
            .map(parseRow);


        return { head, body };
    },

    /**
     * Nettoie le contenu Markdown en enlevant les tableaux (pour n'extraire que le texte)
     */
    removeTables: (content: string): string => {
        return content
            .split("\n")
            .filter(line => !line.trim().startsWith("|"))
            .join("\n")
            .trim();
    }
};

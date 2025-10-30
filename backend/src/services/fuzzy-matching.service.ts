import { Candidate, MatchResult, MatchingOptions } from '../types/fuzzy-matching.types';

export class FuzzyMatchingService {
    private defaultOptions: MatchingOptions = {
        threshold: 0.7,     // score minimum pour considérer une correspondance
        nameWeight: 0.5,    // importance du nom dans le calcul du score final
        dateWeight: 0.5,    // importance de la date dans le calcul du score final
        fuzzyDateMatching: true
    };

    /**
     * Calculates the Levenshtein distance between two strings
     * @param a First string
     * @param b Second string
     * @returns Levenshtein distance
     */
    private levenshteinDistance(a: string, b: string): number {
        if (a.length === 0) return b.length;
        if (b.length === 0) return a.length;

        const matrix = Array(a.length + 1).fill(null).map(() => Array(b.length + 1).fill(null));

        // Initialisation des valeurs de base
        for (let i = 0; i <= a.length; i++) {
            matrix[i][0] = i;
        }

        for (let j = 0; j <= b.length; j++) {
            matrix[0][j] = j;
        }

        // Remplissage de la matrice
        for (let i = 1; i <= a.length; i++) {
            for (let j = 1; j <= b.length; j++) {
                const cost = a[i - 1] === b[j - 1] ? 0 : 1;
                matrix[i][j] = Math.min(
                    matrix[i - 1][j] + 1,        // suppression
                    matrix[i][j - 1] + 1,        // insertion
                    matrix[i - 1][j - 1] + cost  // substitution
                );
            }
        }

        return matrix[a.length][b.length];
    }

    /**
     * Calculates the similarity between two strings (score between 0 and 1)
     * @param a First string
     * @param b Second string
     * @returns Similarity score (1 = identical, 0 = completely different)
     */
    private stringSimilarity(a: string, b: string): number {
        if (!a || !b) return 0;

        // Normalisation des chaînes (minuscules, sans accents, sans espaces superflus)
        const normalizeString = (str: string) => {
            return str.toLowerCase()
                .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // suppression des accents
                .replace(/\s+/g, ' ').trim();  // normalisation des espaces
        };

        const normalizedA = normalizeString(a);
        const normalizedB = normalizeString(b);

        const maxLength = Math.max(normalizedA.length, normalizedB.length);
        if (maxLength === 0) return 1; // Deux chaînes vides sont considérées identiques

        const distance = this.levenshteinDistance(normalizedA, normalizedB);
        return 1 - distance / maxLength;
    }

    /**
     * Compares two birth dates and returns a similarity score
     * @param date1 First date
     * @param date2 Second date
     * @returns Similarity score between 0 and 1
     */
    private compareDates(date1?: string, date2?: string): number {
        if (!date1 || !date2) return 0;

        // Si les formats sont exactement identiques
        if (date1 === date2) return 1;

        try {
            // Essai de conversion en objets Date pour comparer
            const d1 = new Date(date1);
            const d2 = new Date(date2);

            // Vérifie si les dates sont valides
            if (isNaN(d1.getTime()) || isNaN(d2.getTime())) {
                return 0;
            }

            // Comparaison des dates
            return d1.getTime() === d2.getTime() ? 1 : 0;
        } catch (e) {
            return 0;
        }
    }

    /**
     * Compares the full name of two candidates
     * @param candidate1 First candidate
     * @param candidate2 Second candidate
     * @returns Name similarity score between 0 and 1
     */
    private compareNames(candidate1: Candidate, candidate2: Candidate): number {
        // Comparer le nom complet (prénom + nom)
        const fullName1 = `${candidate1.firstName} ${candidate1.lastName}`;
        const fullName2 = `${candidate2.firstName} ${candidate2.lastName}`;
        const fullNameScore = this.stringSimilarity(fullName1, fullName2);

        // Comparer le nom complet inversé (nom + prénom) pour gérer les cas où les champs sont inversés
        const reversedName1 = `${candidate1.lastName} ${candidate1.firstName}`;
        const reversedNameScore = this.stringSimilarity(reversedName1, fullName2);

        // Prendre le meilleur score
        return Math.max(fullNameScore, reversedNameScore);
    }

    /**
     * Finds matches between a list of source candidates and a list of target candidates
     * @param sourceCandidates List of source candidates
     * @param targetCandidates List of target candidates
     * @param options Matching options
     * @returns List of matches found, sorted by decreasing score
     */
    findMatches(
        sourceCandidates: Candidate[],
        targetCandidates: Candidate[],
        options?: Partial<MatchingOptions>
    ): MatchResult[] {
        // Fusionner les options par défaut avec les options spécifiées
        const mergedOptions = { ...this.defaultOptions, ...options };

        const results: MatchResult[] = [];

        // Pour chaque candidat source, comparer avec tous les candidats cible
        for (const source of sourceCandidates) {
            for (const target of targetCandidates) {
                // Calculer le score de correspondance du nom
                const nameScore = this.compareNames(source, target);

                // Calculer le score de correspondance de la date de naissance
                let dateScore = 0;
                if (source.dateOfBirth && target.dateOfBirth) {
                    dateScore = this.compareDates(source.dateOfBirth, target.dateOfBirth);
                }

                // Calculer le score global
                const weightedScore =
                    (nameScore * mergedOptions.nameWeight) +
                    (dateScore * mergedOptions.dateWeight);

                // Si le score dépasse le seuil, ajouter aux résultats
                if (weightedScore >= mergedOptions.threshold) {
                    results.push({
                        source,
                        target,
                        score: weightedScore,
                        nameScore,
                        dateScore
                    });
                }
            }
        }

        // Trier les résultats par score décroissant
        return results.sort((a, b) => b.score - a.score);
    }

    /**
     * Finds the best match for each source candidate
     * @param sourceCandidates List of source candidates
     * @param targetCandidates List of target candidates
     * @param options Matching options
     * @returns Array associating each source candidate with its best match (if found)
     */
    findBestMatches(
        sourceCandidates: Candidate[],
        targetCandidates: Candidate[],
        options?: Partial<MatchingOptions>
    ): MatchResult[] {
        const mergedOptions = { ...this.defaultOptions, ...options };

        const bestMatches: MatchResult[] = [];
        const usedTargets = new Set<string | number>();

        // Pour chaque candidat source
        for (const source of sourceCandidates) {
            let bestMatch: MatchResult | null = null;

            // Comparer avec tous les candidats cible non encore utilisés
            for (const target of targetCandidates) {
                if (usedTargets.has(target.id)) continue;

                const nameScore = this.compareNames(source, target);

                let dateScore = 0;
                if (source.dateOfBirth && target.dateOfBirth) {
                    dateScore = this.compareDates(source.dateOfBirth, target.dateOfBirth);
                }

                const weightedScore =
                    (nameScore * mergedOptions.nameWeight) +
                    (dateScore * mergedOptions.dateWeight);

                if (weightedScore >= mergedOptions.threshold &&
                    (!bestMatch || weightedScore > bestMatch.score)) {
                    bestMatch = {
                        source,
                        target,
                        score: weightedScore,
                        nameScore,
                        dateScore
                    };
                }
            }

            if (bestMatch) {
                bestMatches.push(bestMatch);
                usedTargets.add(bestMatch.target.id);
            }
        }

        return bestMatches;
    }
}
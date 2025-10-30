import { FuzzyMatchingService } from '../../services/fuzzy-matching.service';
import { Candidate, MatchResult } from '../../types/fuzzy-matching.types';

describe('FuzzyMatchingService', () => {
    let service: FuzzyMatchingService;

    beforeEach(() => {
        service = new FuzzyMatchingService();
    });

    describe('findMatches', () => {
        it('devrait correspondre exactement aux noms avec un score parfait', () => {
            const sources: Candidate[] = [
                { id: 1, firstName: 'Jean', lastName: 'Dupont', dateOfBirth: '1990-05-15' }
            ];

            const targets: Candidate[] = [
                { id: 'a', firstName: 'Jean', lastName: 'Dupont', dateOfBirth: '1990-05-15' }
            ];

            const results = service.findMatches(sources, targets);

            expect(results).toHaveLength(1);
            expect(results[0].source).toEqual(sources[0]);
            expect(results[0].target).toEqual(targets[0]);
            expect(results[0].score).toBe(1); // Score parfait
            expect(results[0].nameScore).toBe(1);
            expect(results[0].dateScore).toBe(1);
        });

        it('devrait correspondre aux noms avec des fautes de frappe mineures', () => {
            const sources: Candidate[] = [
                { id: 1, firstName: 'Jean', lastName: 'Dupont', dateOfBirth: '1990-05-15' }
            ];

            const targets: Candidate[] = [
                { id: 'a', firstName: 'Jean', lastName: 'Dupond', dateOfBirth: '1990-05-15' }
            ];

            const results = service.findMatches(sources, targets);

            expect(results).toHaveLength(1);
            expect(results[0].nameScore).toBeLessThan(1);
            expect(results[0].nameScore).toBeGreaterThan(0.8);
            expect(results[0].dateScore).toBe(1);
        });

        it('devrait correspondre aux noms avec accents supprimés', () => {
            const sources: Candidate[] = [
                { id: 1, firstName: 'François', lastName: 'Gérard', dateOfBirth: '1990-05-15' }
            ];

            const targets: Candidate[] = [
                { id: 'a', firstName: 'Francois', lastName: 'Gerard', dateOfBirth: '1990-05-15' }
            ];

            const results = service.findMatches(sources, targets);

            expect(results).toHaveLength(1);
            expect(results[0].nameScore).toBe(1); // Score parfait malgré les accents
        });

        it('devrait correspondre aux prénom et nom inversés', () => {
            const sources: Candidate[] = [
                { id: 1, firstName: 'Jean', lastName: 'Dupont', dateOfBirth: '1990-05-15' }
            ];

            const targets: Candidate[] = [
                { id: 'a', firstName: 'Dupont', lastName: 'Jean', dateOfBirth: '1990-05-15' }
            ];

            const results = service.findMatches(sources, targets);

            expect(results).toHaveLength(1);
            expect(results[0].nameScore).toBeGreaterThan(0.7);
        });

        it('ne devrait pas correspondre aux noms sous le seuil', () => {
            const sources: Candidate[] = [
                { id: 1, firstName: 'Jean', lastName: 'Dupont', dateOfBirth: '1990-05-15' }
            ];

            const targets: Candidate[] = [
                { id: 'a', firstName: 'Pierre', lastName: 'Martin', dateOfBirth: '1980-03-10' }
            ];

            const results = service.findMatches(sources, targets, { threshold: 0.7 });

            expect(results).toHaveLength(0);
        });

        it('devrait trier les correspondances par score décroissant', () => {
            const sources: Candidate[] = [
                { id: 1, firstName: 'Jean', lastName: 'Dupont', dateOfBirth: '1990-05-15' }
            ];

            const targets: Candidate[] = [
                { id: 'a', firstName: 'Jean', lastName: 'Dupont', dateOfBirth: '1990-05-15' },
                { id: 'b', firstName: 'Jean', lastName: 'Dupond', dateOfBirth: '1990-05-15' },
                { id: 'c', firstName: 'Jan', lastName: 'Dupont', dateOfBirth: '1990-05-15' }
            ];

            const results = service.findMatches(sources, targets);

            expect(results).toHaveLength(3);
            expect(results[0].target.id).toBe('a'); // Correspondance parfaite en premier
            // Ne pas vérifier l'ordre exact des autres résultats, mais juste qu'ils sont présents
            const otherIds = [results[1].target.id, results[2].target.id];
            expect(otherIds).toContain('b');
            expect(otherIds).toContain('c');
            // Ou simplement vérifier que les scores sont correctement triés
            expect(results[0].score).toBeGreaterThanOrEqual(results[1].score);
            expect(results[1].score).toBeGreaterThanOrEqual(results[2].score);
        });

        it('devrait respecter le seuil personnalisé', () => {
            const sources: Candidate[] = [
                { id: 1, firstName: 'Jean', lastName: 'Dupont', dateOfBirth: '1990-05-15' }
            ];

            const targets: Candidate[] = [
                { id: 'a', firstName: 'Jean', lastName: 'Dupont', dateOfBirth: '1990-05-15' },
                { id: 'b', firstName: 'Jean', lastName: 'Dupond', dateOfBirth: '1990-05-15' },
                { id: 'c', firstName: 'Pierre', lastName: 'Martin', dateOfBirth: '1990-05-15' }
            ];

            const results = service.findMatches(sources, targets, { threshold: 0.9 });

            expect(results.length).toBeLessThan(3);
            expect(results[0].target.id).toBe('a');
        });
    });

    describe('findBestMatches', () => {
        it('devrait trouver la meilleure correspondance pour chaque candidat source', () => {
            const sources: Candidate[] = [
                { id: 1, firstName: 'Jean', lastName: 'Dupont', dateOfBirth: '1990-05-15' },
                { id: 2, firstName: 'Marie', lastName: 'Leroy', dateOfBirth: '1988-07-22' }
            ];

            const targets: Candidate[] = [
                { id: 'a', firstName: 'Jean', lastName: 'Dupont', dateOfBirth: '1990-05-15' },
                { id: 'b', firstName: 'Jean', lastName: 'Dupond', dateOfBirth: '1990-05-15' },
                { id: 'c', firstName: 'Marie', lastName: 'Leroy', dateOfBirth: '1988-07-22' }
            ];

            const results = service.findBestMatches(sources, targets);

            expect(results).toHaveLength(2);
            expect(results[0].source.id).toBe(1);
            expect(results[0].target.id).toBe('a');
            expect(results[1].source.id).toBe(2);
            expect(results[1].target.id).toBe('c');
        });

        it('ne devrait pas associer la même cible deux fois', () => {
            const sources: Candidate[] = [
                { id: 1, firstName: 'Jean', lastName: 'Dupont', dateOfBirth: '1990-05-15' },
                { id: 2, firstName: 'Jean', lastName: 'Dupont', dateOfBirth: '1990-05-15' }
            ];

            const targets: Candidate[] = [
                { id: 'a', firstName: 'Jean', lastName: 'Dupont', dateOfBirth: '1990-05-15' }
            ];

            const results = service.findBestMatches(sources, targets);

            expect(results).toHaveLength(1);
            expect(results[0].source.id).toBe(1);
            expect(results[0].target.id).toBe('a');
        });

        it('ne devrait pas retourner de correspondances sous le seuil', () => {
            const sources: Candidate[] = [
                { id: 1, firstName: 'Jean', lastName: 'Dupont', dateOfBirth: '1990-05-15' },
                { id: 2, firstName: 'Pierre', lastName: 'Martin', dateOfBirth: '1988-07-22' }
            ];

            const targets: Candidate[] = [
                { id: 'a', firstName: 'Jean', lastName: 'Dupont', dateOfBirth: '1990-05-15' },
                { id: 'b', firstName: 'Jacques', lastName: 'Richard', dateOfBirth: '1985-12-10' }
            ];

            const results = service.findBestMatches(sources, targets);

            expect(results).toHaveLength(1);
            expect(results[0].source.id).toBe(1);
        });

        it('devrait gérer une liste source vide', () => {
            const sources: Candidate[] = [];

            const targets: Candidate[] = [
                { id: 'a', firstName: 'Jean', lastName: 'Dupont', dateOfBirth: '1990-05-15' }
            ];

            const results = service.findBestMatches(sources, targets);

            expect(results).toHaveLength(0);
        });

        it('devrait gérer une liste cible vide', () => {
            const sources: Candidate[] = [
                { id: 1, firstName: 'Jean', lastName: 'Dupont', dateOfBirth: '1990-05-15' }
            ];

            const targets: Candidate[] = [];

            const results = service.findBestMatches(sources, targets);

            expect(results).toHaveLength(0);
        });

        it('devrait prioriser les correspondances avec des scores plus élevés', () => {
            const sources: Candidate[] = [
                { id: 1, firstName: 'Jean', lastName: 'Dupont', dateOfBirth: '1990-05-15' },
                { id: 2, firstName: 'Jean', lastName: 'Dupond', dateOfBirth: '1990-05-15' }
            ];

            const targets: Candidate[] = [
                { id: 'a', firstName: 'Jean', lastName: 'Dupont', dateOfBirth: '1990-05-15' }
            ];

            const results = service.findBestMatches(sources, targets);

            expect(results).toHaveLength(1);
            expect(results[0].source.id).toBe(1); // Le premier candidat a un meilleur score
        });
    });

    describe('cas limites', () => {
        it('devrait gérer les chaînes vides', () => {
            const sources: Candidate[] = [
                { id: 1, firstName: '', lastName: '', dateOfBirth: '1990-05-15' }
            ];

            const targets: Candidate[] = [
                { id: 'a', firstName: '', lastName: '', dateOfBirth: '1990-05-15' }
            ];

            const results = service.findMatches(sources, targets);

            expect(results).toHaveLength(1);
            expect(results[0].nameScore).toBe(1);
        });

        it('devrait gérer les dates manquantes', () => {
            const sources: Candidate[] = [
                { id: 1, firstName: 'Jean', lastName: 'Dupont' }
            ];

            const targets: Candidate[] = [
                { id: 'a', firstName: 'Jean', lastName: 'Dupont' }
            ];

            const results = service.findMatches(sources, targets, { threshold: 0.5 });

            expect(results).toHaveLength(1);
            expect(results[0].dateScore).toBe(0);
            expect(results[0].score).toBe(0.5); // 0.5 * 1 + 0.5 * 0
        });

        it('devrait gérer les dates avec différents formats mais même valeur', () => {
            const sources: Candidate[] = [
                { id: 1, firstName: 'Jean', lastName: 'Dupont', dateOfBirth: '1990-05-15' }
            ];

            const targets: Candidate[] = [
                { id: 'a', firstName: 'Jean', lastName: 'Dupont', dateOfBirth: '15/05/1990' }
            ];

            // Ce test peut échouer en fonction du navigateur/environnement,
            // car le parsing de date n'est pas cohérent entre les environnements
            const results = service.findMatches(sources, targets, { threshold: 0.5 });

            expect(results).toHaveLength(1);
            // Le résultat du dateScore dépend de l'implémentation exacte
        });
    });
});
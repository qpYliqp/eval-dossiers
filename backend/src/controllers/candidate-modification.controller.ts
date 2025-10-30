import { Request, Response } from "express";
import { CandidateModificationService } from "../services/candidate-modification.service";

export class CandidateModificationController {
    private service: CandidateModificationService;

    constructor() {
        this.service = new CandidateModificationService();
    }

    /**
     * Met à jour le prénom d'un candidat.
     */
    async updateFirstName(req: Request, res: Response): Promise<void> {
        const candidateId = req.params.candidateId;
        const { firstName } = req.body;

        if (!candidateId || !firstName) {
            res.status(400).json({ error: "ID du candidat et prénom requis" });
            return;
        }

        const updatedCandidate = await this.service.updateFirstName(parseInt(candidateId), firstName);

        if (!updatedCandidate) {
            res.status(404).json({ error: "Candidat non trouvé" });
            return;
        }

        res.status(200).json(updatedCandidate);
    }

    /**
     * Met à jour le nom de famille d'un candidat.
     */
    async updateLastName(req: Request, res: Response): Promise<void> {
        const { candidateId, lastName } = req.body;

        if (!candidateId || !lastName) {
            res.status(400).json({ error: "ID du candidat et nom requis" });
            return;
        }

        const updatedCandidate = await this.service.updateLastName(parseInt(candidateId), lastName);

        if (!updatedCandidate) {
            res.status(404).json({ error: "Candidat non trouvé" });
            return;
        }

        res.status(200).json(updatedCandidate);
    }

    /**
     * Met à jour les notes d'un relevé académique.
     */
    async updateAcademicRecord(req: Request, res: Response): Promise<void> {
        const { recordId, gradeSemester1, gradeSemester2 } = req.body;

        if (!recordId || gradeSemester1 === undefined || gradeSemester2 === undefined) {
            res.status(400).json({ error: "ID du relevé académique et notes requises" });
            return;
        }

        const updatedRecord = await this.service.updateAcademicRecord(parseInt(recordId), gradeSemester1, gradeSemester2);

        if (!updatedRecord) {
            res.status(404).json({ error: "Relevé académique non trouvé" });
            return;
        }

        res.status(200).json(updatedRecord);
    }

    /**
     * Met à jour le score d'un candidat.
     */
    async updateCandidateScore(req: Request, res: Response): Promise<void> {
        const { scoreId, scoreValue } = req.body;

        if (!scoreId || !scoreValue) {
            res.status(400).json({ error: "ID du score et valeur requise" });
            return;
        }

        const updatedScore = await this.service.updateCandidateScore(parseInt(scoreId), scoreValue);

        if (!updatedScore) {
            res.status(404).json({ error: "Score non trouvé" });
            return;
        }

        res.status(200).json(updatedScore);
    }
}
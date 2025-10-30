import { CandidateModificationModel } from "../../models/candidate-modification.model";
import pool from "../../config/db";

jest.mock("../../config/db");

describe("CandidateModificationModel", () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    it("doit mettre à jour le prénom et recalculer le nom complet", async () => {
        const mockResult = { rows: [{ candidateId: 1, firstName: "Jean", lastName: "Dupont", fullName: "Jean Dupont" }] };
        (pool.query as jest.Mock).mockResolvedValue(mockResult);

        const result = await CandidateModificationModel.updateFirstName(1, "Jean");

        expect(pool.query).toHaveBeenCalledWith(expect.any(String), ["Jean", 1]);
        expect(result).toEqual(mockResult.rows[0]);
    });

    it("doit mettre à jour le nom de famille et recalculer le nom complet", async () => {
        const mockResult = { rows: [{ candidateId: 1, firstName: "Jean", lastName: "Martin", fullName: "Jean Martin" }] };
        (pool.query as jest.Mock).mockResolvedValue(mockResult);

        const result = await CandidateModificationModel.updateLastName(1, "Martin");

        expect(pool.query).toHaveBeenCalledWith(expect.any(String), ["Martin", 1]);
        expect(result).toEqual(mockResult.rows[0]);
    });

    it("doit mettre à jour un relevé académique", async () => {
        const mockResult = { rows: [{ recordId: 5, gradeSemester1: 15.5, gradeSemester2: 14.0 }] };
        (pool.query as jest.Mock).mockResolvedValue(mockResult);

        const result = await CandidateModificationModel.updateAcademicRecord(5, 15.5, 14.0);

        expect(pool.query).toHaveBeenCalledWith(expect.any(String), [15.5, 14.0, 5]);
        expect(result).toEqual(mockResult.rows[0]);
    });

    it("doit mettre à jour un score de candidat", async () => {
        const mockResult = { rows: [{ scoreId: 10, scoreValue: "87.5" }] };
        (pool.query as jest.Mock).mockResolvedValue(mockResult);

        const result = await CandidateModificationModel.updateCandidateScore(10, "87.5");

        expect(pool.query).toHaveBeenCalledWith(expect.any(String), ["87.5", 10]);
        expect(result).toEqual(mockResult.rows[0]);
    });
});
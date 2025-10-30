import { CandidateModificationService } from "../../services/candidate-modification.service";
import { CandidateModificationModel } from "../../models/candidate-modification.model";
import { NormalizedCandidate, AcademicRecord, CandidateScore } from "../../types/monmaster-normalization.types";

jest.mock("../../models/candidate-modification.model");

describe("CandidateModificationService", () => {
    let service: CandidateModificationService;

    beforeEach(() => {
        service = new CandidateModificationService(); // ⚠️ Utilisation d'une instance !
        jest.clearAllMocks();
    });

    test("updateFirstName met à jour le prénom et le fullName", async () => {
        const mockCandidate: NormalizedCandidate = {
            candidateId: 1,
            monmasterFileId: 12345,
            candidateNumber: "CAND98765",
            firstName: "Alice",
            lastName: "Doe",
            fullName: "Alice Doe",
            dateOfBirth: "1995-06-15",
        };

        (CandidateModificationModel.updateFirstName as jest.Mock).mockResolvedValue(mockCandidate);

        const result = await service.updateFirstName(1, "Alice"); // ⚠️ Utilisation de l'instance

        expect(CandidateModificationModel.updateFirstName).toHaveBeenCalledWith(1, "Alice");
        expect(result).toEqual(mockCandidate);
    });

    test("updateLastName met à jour le nom et le fullName", async () => {
        const mockCandidate: NormalizedCandidate = {
            candidateId: 1,
            monmasterFileId: 12345,
            candidateNumber: "CAND98765",
            firstName: "John",
            lastName: "Smith",
            fullName: "John Smith",
            dateOfBirth: "1995-06-15",
        };

        (CandidateModificationModel.updateLastName as jest.Mock).mockResolvedValue(mockCandidate);

        const result = await service.updateLastName(1, "Smith");

        expect(CandidateModificationModel.updateLastName).toHaveBeenCalledWith(1, "Smith");
        expect(result).toEqual(mockCandidate);
    });

    test("updateAcademicRecord met à jour les notes d'un relevé académique", async () => {
        const mockRecord: AcademicRecord = {
            recordId: 1,
            candidateId: 1,
            academicYear: "2023-2024",
            programType: "Master",
            curriculumYear: "M2",
            specialization: "IA",
            coursePath: "Deep Learning",
            gradeSemester1: 15,
            gradeSemester2: 16,
            institution: "Université de Bordeaux",
        };

        (CandidateModificationModel.updateAcademicRecord as jest.Mock).mockResolvedValue(mockRecord);

        const result = await service.updateAcademicRecord(1, 15, 16);

        expect(CandidateModificationModel.updateAcademicRecord).toHaveBeenCalledWith(1, 15, 16);
        expect(result).toEqual(mockRecord);
    });

    test("updateCandidateScore met à jour le score d'un candidat", async () => {
        const mockScore: CandidateScore = {
            scoreId: 1,
            candidateId: 1,
            scoreLabel: "Math",
            scoreValue: "18",
        };

        (CandidateModificationModel.updateCandidateScore as jest.Mock).mockResolvedValue(mockScore);

        const result = await service.updateCandidateScore(1, "18");

        expect(CandidateModificationModel.updateCandidateScore).toHaveBeenCalledWith(1, "18");
        expect(result).toEqual(mockScore);
    });
});

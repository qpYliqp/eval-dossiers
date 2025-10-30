import { CandidateModificationController } from "../../controllers/candidate-modification.controller";
import { CandidateModificationService } from "../../services/candidate-modification.service";
import { Request, Response } from "express";

jest.mock("../../services/candidate-modification.service");

describe("CandidateModificationController", () => {
    let controller: CandidateModificationController;
    let mockService: jest.Mocked<CandidateModificationService>;
    let mockReq: Partial<Request>;
    let mockRes: Partial<Response>;

    beforeEach(() => {
        // Crée une instance mockée du service
        mockService = new CandidateModificationService() as jest.Mocked<CandidateModificationService>;

        // Injecte le service mocké dans le contrôleur
        controller = new CandidateModificationController();
        (controller as any).service = mockService;

        // Mock des objets Request et Response
        mockReq = {};
        mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };
    });

    describe("updateFirstName", () => {
        it("devrait retourner une erreur 400 si l'ID ou le prénom est manquant", async () => {
            mockReq.params = {}; // Pas de candidateId
            mockReq.body = {}; // Pas de firstName

            await controller.updateFirstName(mockReq as Request, mockRes as Response);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({ error: "ID du candidat et prénom requis" });
        });

        it("devrait retourner une erreur 404 si le candidat n'est pas trouvé", async () => {
            // Mock des paramètres et du corps de la requête
            mockReq.params = { candidateId: "1" };
            mockReq.body = { firstName: "John" };

            // Simule un candidat non trouvé
            mockService.updateFirstName.mockResolvedValue(null);

            await controller.updateFirstName(mockReq as Request, mockRes as Response);

            expect(mockService.updateFirstName).toHaveBeenCalledWith(1, "John");
            expect(mockRes.status).toHaveBeenCalledWith(404);
            expect(mockRes.json).toHaveBeenCalledWith({ error: "Candidat non trouvé" });
        });

        it("devrait retourner un candidat mis à jour avec succès", async () => {
            const updatedCandidate = { candidateId: 1, firstName: "John"};

            // Mock des paramètres et du corps de la requête
            mockReq.params = { candidateId: "1" };
            mockReq.body = { firstName: "John" };

            // Simule un candidat mis à jour avec succès
            mockService.updateFirstName = jest.fn().mockResolvedValue(updatedCandidate);

            await controller.updateFirstName(mockReq as Request, mockRes as Response);

            expect(mockService.updateFirstName).toHaveBeenCalledWith(1, "John");
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith(updatedCandidate);
        });
    });
});



// import { CandidateModificationController } from "../../controllers/candidate-modification.controller";
// import { CandidateModificationService } from "../../services/candidate-modification.service";
// import { Request, Response } from "express";

// jest.mock("../../services/candidate-modification.service");

// describe("CandidateModificationController", () => {
//     let controller: CandidateModificationController;
//     let mockService: jest.Mocked<CandidateModificationService>;
//     let mockReq: Partial<Request>;
//     let mockRes: Partial<Response>;

//     beforeEach(() => {
//       mockService = new CandidateModificationService() as jest.Mocked<CandidateModificationService>;
//       controller = new CandidateModificationController();
//       (controller as any).service = mockService; // Injection du mock

//       mockReq = {};
//       mockRes = {
//           status: jest.fn().mockReturnThis(),
//           json: jest.fn(),
//       };
//   });

//     describe("updateFirstName", () => {
//         it("devrait retourner une erreur 400 si l'ID ou le prénom est manquant", async () => {
//             mockReq.params = {}; // Pas de candidateId
//             mockReq.body = {}; // Pas de firstName

//             await controller.updateFirstName(mockReq as Request, mockRes as Response);

//             expect(mockRes.status).toHaveBeenCalledWith(400);
//             expect(mockRes.json).toHaveBeenCalledWith({ error: "ID du candidat et prénom requis" });
//         });

//         it("devrait retourner une erreur 404 si le candidat n'est pas trouvé", async () => {
//             mockReq.params = { candidateId: "1" };
//             mockReq.body = { firstName: "John" };
//             mockService.updateFirstName = jest.fn().mockResolvedValue(null); // Simule un candidat non trouvé

//             await controller.updateFirstName(mockReq as Request, mockRes as Response);

//             expect(mockService.updateFirstName).toHaveBeenCalledWith(1, "John");
//             expect(mockRes.status).toHaveBeenCalledWith(404);
//             expect(mockRes.json).toHaveBeenCalledWith({ error: "Candidat non trouvé" });
//         });

//         it("devrait retourner un candidat mis à jour avec succès", async () => {
//             const updatedCandidate = { id: 1, firstName: "John" };
//             mockReq.params = { candidateId: "1" };
//             mockReq.body = { firstName: "John" };
//             mockService.updateFirstName = jest.fn().mockResolvedValue(updatedCandidate); // Simule un candidat mis à jour

//             await controller.updateFirstName(mockReq as Request, mockRes as Response);

//             expect(mockService.updateFirstName).toHaveBeenCalledWith(1, "John");
//             expect(mockRes.status).toHaveBeenCalledWith(200);
//             expect(mockRes.json).toHaveBeenCalledWith(updatedCandidate);
//         });
//     });
// });

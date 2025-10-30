import express from "express";
import masterProgramRoute from "./routes/master-program.routes";
import fileRoute from "./routes/file.routes";
import mappingRoutes from './routes/mapping.routes';
import pvNormalizationRoutes from './routes/pv-normalization.routes';
import monmasterNormalizationRoutes from './routes/monmaster-normalization.routes';
import cors from "cors";
import { specs, swaggerUi } from './config/swagger';
import { FileService } from './services/file.service';
import columnSelection from "./routes/column-selection.routes";
import gradeComparisonRoutes from "./routes/grade-comparison.routes";
import candidateModificationRoutes from "./routes/candidate.routes";


const app = express();
const port = 3000;

FileService.initializeStorage();
// Configuration CORS
const corsOptions = {
  origin: "http://localhost:4200", // Remplacez par l'URL de votre frontend
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));
app.use("/api/master-programs", masterProgramRoute);
app.use("/api/files", fileRoute);
app.use('/api/mapping', mappingRoutes);
app.use('/api/column-selection', columnSelection);
app.use('/api/pv-normalization', pvNormalizationRoutes);
app.use('/api/monmaster-normalization', monmasterNormalizationRoutes);
app.use('/api/grade-comparison', gradeComparisonRoutes);
app.use('/api/candidates', candidateModificationRoutes);

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
  console.log(`API docs available at http://localhost:${port}/api-docs`);
});
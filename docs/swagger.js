import swaggerUi from "swagger-ui-express";

const openApiSpec = {
  openapi: "3.0.3",
  info: {
    title: "Patent Filing API",
    version: "1.0.0",
    description: "APIs for authentication and managing patent filings",
  },
  servers: [
    {
      url: "/",
      description: "Current server",
    },
  ],
  tags: [
    { name: "Health", description: "Service health APIs" },
    { name: "Auth", description: "Authentication APIs" },
    { name: "Admin", description: "Admin management APIs" },
    { name: "Agent", description: "Agent workflow APIs" },
    { name: "Client", description: "Client workflow APIs" },
    { name: "Patent Filing API", description: "APIs for managing patent filings" },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
    schemas: {
      MessageResponse: {
        type: "object",
        properties: {
          message: { type: "string" },
        },
      },
      SuccessResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: true },
          data: { type: "object", additionalProperties: true },
        },
      },
      ErrorResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: false },
          message: { type: "string" },
        },
      },
      CreateUserRequest: {
        type: "object",
        required: ["name", "email", "password"],
        properties: {
          name: { type: "string" },
          email: { type: "string", format: "email" },
          password: { type: "string", minLength: 6 },
        },
      },
      AssignPatentRequest: {
        type: "object",
        required: ["patentId", "agentId"],
        properties: {
          patentId: { type: "string" },
          agentId: { type: "string" },
        },
      },
      AgentUpdatePatentStatusRequest: {
        type: "object",
        required: ["status"],
        properties: {
          status: {
            type: "string",
            enum: ["APPROVED", "REJECTED"],
          },
        },
      },
      ClientSubmitPatentRequest: {
        type: "object",
        required: ["title", "description"],
        properties: {
          title: { type: "string" },
          description: { type: "string" },
        },
      },
      RegisterRequest: {
        type: "object",
        required: ["name", "email", "password"],
        properties: {
          name: { type: "string" },
          email: { type: "string", format: "email" },
          password: { type: "string", minLength: 6 },
          role: { type: "string", enum: ["CLIENT", "ADMIN", "AGENT"] },
        },
      },
      RegisterResponse: {
        type: "object",
        properties: {
          message: { type: "string" },
          user: {
            type: "object",
            properties: {
              id: { type: "string" },
              name: { type: "string" },
              email: { type: "string" },
              role: { type: "string" },
              createdAt: { type: "string", format: "date-time" },
            },
          },
        },
      },
      LoginRequest: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: { type: "string", format: "email" },
          password: { type: "string" },
        },
      },
      LoginResponse: {
        type: "object",
        properties: {
          message: { type: "string" },
          token: { type: "string" },
          user: {
            type: "object",
            properties: {
              id: { type: "string" },
              name: { type: "string" },
              email: { type: "string" },
              role: { type: "string" },
              createdAt: { type: "string", format: "date-time" },
            },
          },
        },
      },
      PatentDetails: {
        type: "object",
        properties: {
          referenceNumber: { type: "string" },
          patentId: { type: "string" },
          title: { type: "string", nullable: true },
          fieldOfInvention: { type: "string", nullable: true },
          fieldOfInventionOther: { type: "string", nullable: true },
          abstractText: { type: "string", nullable: true },
          supportingDocumentUrl: { type: "string", nullable: true },
          applicantName: { type: "string", nullable: true },
          applicantEmail: { type: "string", nullable: true },
          applicantMobile: { type: "string", nullable: true },
          status: {
            type: "string",
            enum: ["DRAFT", "PENDING", "APPROVED", "REJECTED"],
          },
          submittedAt: { type: "string", format: "date-time", nullable: true },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      SubmitPatentBody: {
        type: "object",
        properties: {
          supportingDocument: { type: "string" },
        },
      },
      SaveDraftRequest: {
        type: "object",
        properties: {
          draftId: { type: "string" },
          title: { type: "string" },
          fieldOfInvention: { type: "string" },
          fieldOfInventionOther: { type: "string" },
          abstractText: { type: "string" },
          applicantName: { type: "string" },
          applicantEmail: { type: "string" },
          applicantMobile: { type: "string" },
        },
      },
    },
  },
  paths: {
    "/api/health": {
      get: {
        tags: ["Health"],
        summary: "Health check",
        responses: {
          200: {
            description: "Server is healthy",
            content: {
              "text/plain": {
                schema: {
                  type: "string",
                  example: "Server running",
                },
              },
            },
          },
        },
      },
    },
    "/api/auth/register": {
      post: {
        tags: ["Auth"],
        summary: "Register user",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/RegisterRequest" },
            },
          },
        },
        responses: {
          201: {
            description: "User registered successfully",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/RegisterResponse" },
              },
            },
          },
          400: {
            description: "Validation failed",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/MessageResponse" },
              },
            },
          },
          409: {
            description: "Email already exists",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/MessageResponse" },
              },
            },
          },
        },
      },
    },
    "/api/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Login user",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/LoginRequest" },
            },
          },
        },
        responses: {
          200: {
            description: "Login successful",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/LoginResponse" },
              },
            },
          },
          401: {
            description: "Invalid credentials",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/MessageResponse" },
              },
            },
          },
        },
      },
    },
    "/api/admin/create-agent": {
      post: {
        tags: ["Admin"],
        summary: "Create agent",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateUserRequest" },
            },
          },
        },
        responses: {
          201: {
            description: "Agent created",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/SuccessResponse" },
              },
            },
          },
          400: {
            description: "Validation failed",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          409: {
            description: "Email already exists",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/api/admin/create-client": {
      post: {
        tags: ["Admin"],
        summary: "Create client",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateUserRequest" },
            },
          },
        },
        responses: {
          201: {
            description: "Client created",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/SuccessResponse" },
              },
            },
          },
          400: {
            description: "Validation failed",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          409: {
            description: "Email already exists",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/api/admin/assign-patent": {
      post: {
        tags: ["Admin"],
        summary: "Assign patent to agent",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/AssignPatentRequest" },
            },
          },
        },
        responses: {
          200: {
            description: "Patent assigned",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/SuccessResponse" },
              },
            },
          },
          400: {
            description: "Validation failed",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          404: {
            description: "Patent not found",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/api/admin/users": {
      get: {
        tags: ["Admin"],
        summary: "Get all users",
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: "Users list",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/SuccessResponse" },
              },
            },
          },
        },
      },
    },
    "/api/admin/user/{id}": {
      delete: {
        tags: ["Admin"],
        summary: "Delete user",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: "path",
            name: "id",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          200: {
            description: "User deleted",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/SuccessResponse" },
              },
            },
          },
          404: {
            description: "User not found",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/api/agent/patents": {
      get: {
        tags: ["Agent"],
        summary: "Get patents assigned to logged-in agent",
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: "Assigned patents",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/SuccessResponse" },
              },
            },
          },
        },
      },
    },
    "/api/agent/patent/{id}": {
      put: {
        tags: ["Agent"],
        summary: "Update assigned patent status",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: "path",
            name: "id",
            required: true,
            schema: { type: "string" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/AgentUpdatePatentStatusRequest",
              },
            },
          },
        },
        responses: {
          200: {
            description: "Patent updated",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/SuccessResponse" },
              },
            },
          },
          400: {
            description: "Invalid status",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          404: {
            description: "Patent not found or not assigned",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/api/patent/submit": {
      post: {
        tags: ["Client"],
        summary: "Submit patent",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ClientSubmitPatentRequest" },
            },
          },
        },
        responses: {
          201: {
            description: "Patent submitted",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/SuccessResponse" },
              },
            },
          },
          400: {
            description: "Validation failed",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/api/client/patents": {
      get: {
        tags: ["Client"],
        summary: "Get patents created by logged-in client",
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: "Client patents list",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/SuccessResponse" },
              },
            },
          },
        },
      },
    },
    "/api/v1/patents/{referenceNumber}": {
      get: {
        tags: ["Patent Filing API"],
        summary: "Get Patent by Reference Number",
        description: "Retrieve patent filing details by reference number",
        parameters: [
          {
            in: "path",
            name: "referenceNumber",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          200: {
            description: "Patent details retrieved successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: { $ref: "#/components/schemas/PatentDetails" },
                  },
                },
              },
            },
          },
          404: {
            description: "Patent filing not found",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/MessageResponse" },
              },
            },
          },
        },
      },
    },
    "/api/v1/patents/user/filings": {
      get: {
        tags: ["Patent Filing API"],
        summary: "Get User's Patent Filings",
        description: "Get all patent filings for the authenticated user",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "page",
            in: "query",
            schema: { type: "integer", default: 0 },
          },
          {
            name: "size",
            in: "query",
            schema: { type: "integer", default: 10 },
          },
          {
            name: "status",
            in: "query",
            schema: {
              type: "string",
              enum: ["DRAFT", "PENDING", "APPROVED", "REJECTED"],
            },
          },
          {
            name: "sort",
            in: "query",
            schema: { type: "string", default: "submittedAt,desc" },
          },
        ],
        responses: {
          200: {
            description: "Patent filings retrieved successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "object",
                      properties: {
                        content: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              referenceNumber: { type: "string" },
                              patentId: { type: "string" },
                              title: { type: "string", nullable: true },
                              fieldOfInvention: {
                                type: "string",
                                nullable: true,
                              },
                              status: { type: "string" },
                              submittedAt: {
                                type: "string",
                                format: "date-time",
                                nullable: true,
                              },
                            },
                          },
                        },
                        pageable: {
                          type: "object",
                          properties: {
                            page: { type: "integer" },
                            size: { type: "integer" },
                            totalElements: { type: "integer" },
                            totalPages: { type: "integer" },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          400: {
            description: "Invalid parameters",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/MessageResponse" },
              },
            },
          },
        },
      },
    },
    "/api/v1/patents/reference-number/next": {
      get: {
        tags: ["Patent Filing API"],
        summary: "Generate Reference Number",
        description:
          "Generate the next available reference number for the current year",
        responses: {
          200: {
            description: "Reference number generated successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "object",
                      properties: {
                        referenceNumber: { type: "string" },
                        year: { type: "integer" },
                        sequenceNumber: { type: "integer" },
                      },
                    },
                  },
                },
              },
            },
          },
          500: {
            description: "Reference number generation failed",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/MessageResponse" },
              },
            },
          },
        },
      },
    },
    "/api/v1/patents/draft/{draftId}": {
      get: {
        tags: ["Patent Filing API"],
        summary: "Get Patent Draft",
        description: "Retrieve a saved draft",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: "path",
            name: "draftId",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          200: {
            description: "Draft retrieved successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: { $ref: "#/components/schemas/PatentDetails" },
                  },
                },
              },
            },
          },
          404: {
            description: "Draft not found",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/MessageResponse" },
              },
            },
          },
        },
      },
    },
    "/api/v1/patents/submit": {
      post: {
        tags: ["Patent Filing API"],
        summary: "Submit Patent Filing",
        description: "Submit a new patent filing application",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "title",
            in: "query",
            required: true,
            schema: { type: "string" },
          },
          {
            name: "fieldOfInvention",
            in: "query",
            required: true,
            schema: { type: "string" },
          },
          {
            name: "fieldOfInventionOther",
            in: "query",
            schema: { type: "string" },
          },
          {
            name: "abstract",
            in: "query",
            required: true,
            schema: { type: "string" },
          },
          {
            name: "applicantName",
            in: "query",
            required: true,
            schema: { type: "string" },
          },
          {
            name: "applicantEmail",
            in: "query",
            required: true,
            schema: { type: "string", format: "email" },
          },
          {
            name: "applicantMobile",
            in: "query",
            required: true,
            schema: { type: "string" },
          },
        ],
        requestBody: {
          required: false,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/SubmitPatentBody" },
            },
          },
        },
        responses: {
          201: {
            description: "Patent filing submitted successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string" },
                    data: {
                      type: "object",
                      properties: {
                        referenceNumber: { type: "string" },
                        patentId: { type: "string" },
                        submittedAt: { type: "string", format: "date-time" },
                        status: { type: "string" },
                        applicantEmail: { type: "string" },
                      },
                    },
                  },
                },
              },
            },
          },
          400: {
            description: "Validation failed",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/MessageResponse" },
              },
            },
          },
          500: {
            description: "Internal server error",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/MessageResponse" },
              },
            },
          },
        },
      },
    },
    "/api/v1/patents/draft": {
      post: {
        tags: ["Patent Filing API"],
        summary: "Save Patent Draft",
        description: "Save a draft patent filing (incomplete)",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/SaveDraftRequest" },
            },
          },
        },
        responses: {
          200: {
            description: "Draft saved successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string" },
                    data: {
                      type: "object",
                      properties: {
                        draftId: { type: "string" },
                        savedAt: { type: "string", format: "date-time" },
                      },
                    },
                  },
                },
              },
            },
          },
          400: {
            description: "Invalid request",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/MessageResponse" },
              },
            },
          },
        },
      },
    },
  },
};

export const setupSwagger = (app) => {
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(openApiSpec));
  app.get("/api-docs.json", (_req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.status(200).send(openApiSpec);
  });
};

export { openApiSpec };

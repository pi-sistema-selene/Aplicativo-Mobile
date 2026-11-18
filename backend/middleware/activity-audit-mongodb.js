const Activity = require("../models-mongodb/Activity");

const actionByMethod = {
  POST: "CREATE",
  PUT: "UPDATE",
  PATCH: "UPDATE",
  DELETE: "DELETE",
};

function auditActivity(req, res, next) {
  const action = actionByMethod[req.method];
  if (!action) return next();

  res.on("finish", () => {
    if (res.statusCode < 200 || res.statusCode >= 300) return;

    const actorId = req.adminId || req.userId;
    if (!actorId) return;

    const endpoint = `${req.baseUrl || ""}${req.route?.path || req.path}`;
    const resourceId =
      req.params?.id ||
      req.params?.chatId ||
      req.params?.dispositivo_id ||
      req.params?.dispositivoId;

    Activity.create({
      actorId,
      actorType: req.adminId ? "Admin" : "User",
      action,
      endpoint,
      resourceId: resourceId ? String(resourceId) : undefined,
      statusCode: res.statusCode,
    }).catch((error) => {
      console.error("Erro ao registrar ação do usuário:", error);
    });
  });

  next();
}

module.exports = auditActivity;

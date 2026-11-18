const mongoose = require("mongoose");

const activitySchema = new mongoose.Schema(
  {
    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: "actorType",
    },
    actorType: {
      type: String,
      required: true,
      enum: ["User", "Admin"],
    },
    action: {
      type: String,
      required: true,
      enum: ["CREATE", "UPDATE", "DELETE"],
    },
    endpoint: {
      type: String,
      required: true,
      maxlength: 300,
    },
    resourceId: {
      type: String,
      maxlength: 100,
    },
    statusCode: {
      type: Number,
      required: true,
    },
  },
  { timestamps: { createdAt: "createdAt", updatedAt: false } },
);

activitySchema.index({ actorType: 1, actorId: 1, createdAt: -1 });

module.exports = mongoose.model("Activity", activitySchema);

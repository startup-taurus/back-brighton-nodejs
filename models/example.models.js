const mongoose = require("mongoose");
const { Schema } = mongoose;
const exampleSchema = new Schema(
  {
    example_id: {
      type: Number,
      unique: true,
    },
  }, {
  timestamps: true,
});
exampleSchema.pre("save", async function (next) {
  const doc = this;
  try {
    if (doc.isNew && !doc.user_id) {
      const lastExample = await mongoose.model("Example")
        .findOne()
        .sort({ createdAt: -1 });

      const nextExampleId = lastExample ? lastExample.example_id + 1 : 1;
      doc.example_id = nextExampleId;
    }
    next();
  } catch (error) {
    next(error);
  }
});
const Example = (module.exports = mongoose.model("Example", exampleSchema));

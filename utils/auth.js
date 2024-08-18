const bcrypt = require("bcryptjs");
const speakeasy = require("speakeasy");
const base32 = require('thirty-two');
const qrcode = require('qrcode');
const jwt = require("jsonwebtoken");
let _secret = null;
class AuthUtils {
  constructor({ config }) {
    _secret = config.JWT_SECRET;
  }
  // Método para generar un hash usando bcrypt
  async hashPassword(password) {
    const saltRounds = 10;
    return await bcrypt.hash(password, saltRounds);
  }

  // Método para comparar una contraseña con su hash usando bcrypt
  async comparePassword(password, hashedPassword) {
    return await bcrypt.compare(password, hashedPassword);
  }

  // Método para generar un token JWT
  generateToken(id) {
    return jwt.sign({ id }, _secret, {
      expiresIn: "30d",
    });
  }

  // Método para verificar el código de autenticación de dos factores
  verifyTwoFactorCode(secret, token) {
    try {
      const verified = speakeasy.totp.verify({
        secret: secret,
        encoding: "base32",
        token: token,
        window: 1,
      });
      return verified;
    } catch (err) {
      console.error("Error verifying two-factor authentication code:", err);
      return false;
    }
  }

  // Función para validar una id de mongo (utilizada para las req.params)
  isValidMongoId = (id) => {
    const mongoIdRegex = /^[0-9a-fA-F]{24}$/;
    return mongoIdRegex.test(id);
  };

  // Función para generar un secreto de Speakeasy
   generateSpeakeasySecret() {
    return speakeasy.generateSecret({ length: 20 });
  }

   // Función para codificar el secreto en base32
   encodeBase32(secret) {
    return base32.encode(secret.base32).toString();
  }

  // Función para generar la imagen del código QR
  async generateQrCode(otpauthURL) {
    try {
      return await qrcode.toDataURL(otpauthURL);
    } catch (error) {
      console.error("Error generating QR code:", error);
      throw new Error("Error generating QR code");
    }
  }


}

module.exports = AuthUtils;

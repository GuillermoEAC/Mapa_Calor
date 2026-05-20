// ─────────────────────────────────────────────────────────────────────────────
// Tests de Autenticación (CU: Login Admin)
// ─────────────────────────────────────────────────────────────────────────────

const { hacerRequest, assert, assertEqual, seccion } = require("./helpers");

async function testAuth() {
  seccion("AUTH — Login de Administrador");

  // Test 1: Login exitoso con credenciales correctas
  {
    const { status, cuerpo } = await hacerRequest("/login", {
      method: "POST",
      body: JSON.stringify({
        usuario: "admin",
        password: "123456",
      }),
    });
    assertEqual(status, 200, "Login exitoso retorna 200");
    assertEqual(cuerpo.success, true, "Login exitoso retorna success: true");
    assert(
      cuerpo.mensaje && cuerpo.mensaje.length > 0,
      "Login exitoso retorna un mensaje de bienvenida"
    );
  }

  // Test 2: Login fallido con contraseña incorrecta
  {
    const { status, cuerpo } = await hacerRequest("/login", {
      method: "POST",
      body: JSON.stringify({
        usuario: "admin",
        password: "contraseña_incorrecta",
      }),
    });
    assertEqual(status, 401, "Contraseña incorrecta retorna 401");
    assertEqual(
      cuerpo.success,
      false,
      "Contraseña incorrecta retorna success: false"
    );
  }

  // Test 3: Login fallido con usuario inexistente
  {
    const { status, cuerpo } = await hacerRequest("/login", {
      method: "POST",
      body: JSON.stringify({
        usuario: "noexiste@test.com",
        password: "123456",
      }),
    });
    assertEqual(status, 401, "Usuario inexistente retorna 401");
    assertEqual(
      cuerpo.success,
      false,
      "Usuario inexistente retorna success: false"
    );
  }

  // Test 4: Login sin campos
  {
    const { status, cuerpo } = await hacerRequest("/login", {
      method: "POST",
      body: JSON.stringify({}),
    });
    // El sistema debería retornar 401 ya que no encuentra coincidencia
    assert(
      status === 401 || status === 400,
      "Login sin campos retorna error (401 o 400)"
    );
  }
}

module.exports = testAuth;

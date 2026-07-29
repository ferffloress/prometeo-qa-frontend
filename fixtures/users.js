function createUser() {
  const timestamp = Date.now();

  return {
    name: "Juan Pérez",
    email: `juan.${timestamp}@mail.com`,
    password: "Password123!",
    firstName: "Juan",
    lastName: "Pérez",
    company: "Prometeo",
    address: "Av. Siempre Viva 123",
    country: "United States",
    state: "California",
    city: "Los Angeles",
    zipcode: "90001",
    mobileNumber: "5551234567",
    day: "10",
    month: "January",
    year: "1990",
  };
}

module.exports = { createUser };

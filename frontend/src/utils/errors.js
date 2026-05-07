export const buildErrorMessage = async (response) => {
  try {
    const data = await response.json()
    return data?.detail ?? 'Error inesperado'
  } catch (error) {
    return 'Error inesperado'
  }
}

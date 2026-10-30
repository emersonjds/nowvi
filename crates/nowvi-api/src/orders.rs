use crate::error::AppError;

/// ponytail: Pix stays off until NOWVI-2 wires AbacatePay; `ABACATEPAY_API_KEY` is read there.
pub async fn create() -> AppError {
    AppError::PaymentsDisabled
}

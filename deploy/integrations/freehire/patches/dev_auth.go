package handler

import (
	"os"

	"github.com/gofiber/fiber/v2"
)

const (
	devAuthEnv          = "FREEHIRE_DEV_AUTH_BYPASS"
	devAuthEmail        = "dev-local@stackwise.local"
	devAuthPassword     = "stackwise-local-dev-only-not-for-prod"
	devAuthTimezone     = "UTC"
)

// DevLogin creates or reuses a fixed local dev account and sets the session cookie.
// Enabled only when FREEHIRE_DEV_AUTH_BYPASS=1 (Stackwise local compose).
func (h *authHandlers) DevLogin(c *fiber.Ctx) error {
	if os.Getenv(devAuthEnv) != "1" {
		return fiber.NewError(fiber.StatusNotFound, "not found")
	}
	user, err := h.accounts.Login(c.Context(), devAuthEmail, devAuthPassword)
	if err != nil {
		tz := devAuthTimezone
		user, err = h.accounts.Register(c.Context(), devAuthEmail, devAuthPassword, &tz)
		if err != nil {
			return accountsError(err)
		}
	}
	if err := h.setSession(c, user.ID); err != nil {
		return err
	}
	return c.JSON(fiber.Map{"data": h.toUserResponseWithTier(c.Context(), user)})
}

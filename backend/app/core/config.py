from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
    )

    # LLM 配置（必填）
    LLM_API_KEY: str
    LLM_BASE_URL: str
    LLM_MODEL: str

    # 服务配置（有默认值）
    ALLOWED_ORIGINS: str = "http://localhost:5173"
    PORT: int = 8000
    DATABASE_PATH: str = "data/aha_tutor.db"
    PLUGINS_DIR: str = "plugins"

    def allowed_origins_list(self) -> list[str]:
        return [o.strip() for o in self.ALLOWED_ORIGINS.split(",") if o.strip()]


settings = Settings()

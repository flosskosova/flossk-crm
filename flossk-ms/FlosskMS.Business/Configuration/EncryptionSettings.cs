namespace FlosskMS.Business.Configuration;

public class EncryptionSettings
{
    public string StorePath { get; set; } = "/etc/flossk/secrets/encryption.store";
    public string MasterKeyEnvVar { get; set; } = "FLOSSK_ENCRYPTION_MASTER_KEY";
}

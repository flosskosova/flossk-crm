using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using FlosskMS.Business.Configuration;

namespace FlosskMS.Business.Services;

public class EncryptionKeyStore : IEncryptionKeyStore
{
    private readonly string _storePath;
    private readonly byte[] _masterKey;
    private readonly ILogger<EncryptionKeyStore> _logger;
    private readonly object _lock = new();

    private Dictionary<string, byte[]> _keys = new();
    private string _activeKeyId = "";

    private const string StorePrefix = "$STORE$";

    public string ActiveKeyId
    {
        get { lock (_lock) return _activeKeyId; }
    }

    public EncryptionKeyStore(IOptions<EncryptionSettings> settings, ILogger<EncryptionKeyStore> logger)
    {
        _storePath = settings.Value.StorePath;
        _logger = logger;

        var masterKeyHex = Environment.GetEnvironmentVariable(settings.Value.MasterKeyEnvVar)
            ?? throw new InvalidOperationException(
                $"Environment variable '{settings.Value.MasterKeyEnvVar}' is not set. " +
                $"Generate one with: openssl rand -hex 32");

        _masterKey = Convert.FromHexString(masterKeyHex);

        if (_masterKey.Length != 32)
            throw new InvalidOperationException("Master key must be exactly 32 bytes (64 hex characters).");

        LoadOrInitializeStore();
    }

    public (string keyId, byte[] key) GetActiveKey()
    {
        lock (_lock)
        {
            return (_activeKeyId, _keys[_activeKeyId]);
        }
    }

    public byte[] GetKey(string keyId)
    {
        lock (_lock)
        {
            if (_keys.TryGetValue(keyId, out var key))
                return key;
            throw new InvalidOperationException($"Key '{keyId}' not found in key store.");
        }
    }

    public string AddNewKey()
    {
        var newKey = RandomNumberGenerator.GetBytes(32);
        var newId = GenerateKeyId();

        lock (_lock)
        {
            _keys[newId] = newKey;
            _activeKeyId = newId;
            SaveInternal();
        }

        _logger.LogInformation("Added new encryption key {KeyId} and set as active", newId);
        return newId;
    }

    public void RemoveKey(string keyId)
    {
        lock (_lock)
        {
            if (_keys.Count <= 1)
                throw new InvalidOperationException("Cannot remove the last key from the store.");
            if (keyId == _activeKeyId)
                throw new InvalidOperationException("Cannot remove the active key. Activate a different key first.");
            if (!_keys.Remove(keyId))
                throw new InvalidOperationException($"Key '{keyId}' not found.");

            SaveInternal();
        }

        _logger.LogInformation("Removed encryption key {KeyId} from store", keyId);
    }

    private void LoadOrInitializeStore()
    {
        var dir = Path.GetDirectoryName(_storePath)!;
        Directory.CreateDirectory(dir);

        if (File.Exists(_storePath))
        {
            LoadStore();
        }
        else
        {
            InitializeNewStore();
        }
    }

    private void LoadStore()
    {
        try
        {
            var encryptedContent = File.ReadAllText(_storePath).Trim();
            if (!encryptedContent.StartsWith(StorePrefix))
                throw new InvalidOperationException("Invalid key store format.");

            var raw = Convert.FromBase64String(encryptedContent[StorePrefix.Length..]);

            var nonce = raw.AsSpan(0, 12);
            var tag = raw.AsSpan(raw.Length - 16, 16);
            var ct = raw.AsSpan(12, raw.Length - 12 - 16);
            var plaintextBytes = new byte[ct.Length];

            using var aes = new AesGcm(_masterKey, 16);
            aes.Decrypt(nonce, ct, tag, plaintextBytes);

            var json = Encoding.UTF8.GetString(plaintextBytes);
            var store = JsonSerializer.Deserialize<KeyStoreData>(json)
                ?? throw new InvalidOperationException("Failed to deserialize key store.");

            lock (_lock)
            {
                _keys = store.Keys.ToDictionary(k => k.Key, k => Convert.FromHexString(k.Value));
                _activeKeyId = store.ActiveKeyId;
            }

            _logger.LogInformation("Loaded encryption key store with {KeyCount} keys, active: {ActiveKey}",
                _keys.Count, _activeKeyId);
        }
        catch (CryptographicException)
        {
            throw new InvalidOperationException(
                "Failed to decrypt the encryption key store. " +
                "The FLOSSK_ENCRYPTION_MASTER_KEY environment variable is incorrect or the store is corrupted.");
        }
    }

    private void InitializeNewStore()
    {
        var initialKey = RandomNumberGenerator.GetBytes(32);
        var initialId = GenerateKeyId();

        lock (_lock)
        {
            _keys = new Dictionary<string, byte[]> { { initialId, initialKey } };
            _activeKeyId = initialId;
        }

        SaveInternal();

        _logger.LogInformation("Generated new encryption key store at {StorePath} with key {KeyId}",
            _storePath, initialId);
    }

    private void SaveInternal()
    {
        var storeData = new KeyStoreData
        {
            ActiveKeyId = _activeKeyId,
            Keys = _keys.ToDictionary(k => k.Key, k => Convert.ToHexString(k.Value).ToLowerInvariant())
        };

        var json = JsonSerializer.Serialize(storeData);
        var plaintextBytes = Encoding.UTF8.GetBytes(json);
        var nonce = RandomNumberGenerator.GetBytes(12);
        var ciphertext = new byte[plaintextBytes.Length];
        var tag = new byte[16];

        using var aes = new AesGcm(_masterKey, 16);
        aes.Encrypt(nonce, plaintextBytes, ciphertext, tag);

        var combined = new byte[12 + ciphertext.Length + 16];
        Buffer.BlockCopy(nonce, 0, combined, 0, 12);
        Buffer.BlockCopy(ciphertext, 0, combined, 12, ciphertext.Length);
        Buffer.BlockCopy(tag, 0, combined, 12 + ciphertext.Length, 16);

        var fileContent = StorePrefix + Convert.ToBase64String(combined);
        File.WriteAllText(_storePath, fileContent);
    }

    private static string GenerateKeyId()
    {
        var random = RandomNumberGenerator.GetBytes(3);
        return "K" + Convert.ToHexString(random);
    }

    private class KeyStoreData
    {
        public string ActiveKeyId { get; set; } = "";
        public Dictionary<string, string> Keys { get; set; } = new();
    }
}

namespace FlosskMS.Data.Entities;

/// <summary>
/// The kind of credential a <see cref="UserRfidCard"/> represents.
/// </summary>
public enum AccessCredentialType
{
    /// <summary>A physical NFC/RFID card identified by its UUID.</summary>
    NfcCard = 0,

    /// <summary>An Aliro / Apple Home Key credential provisioned onto a phone or watch.</summary>
    HomeKey = 1
}

package com.barilog;
import com.barilog.entities.*;
import com.barilog.services.*;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
class DirectoryPrivacyTest {
 @Test void separateConsentAndBuildingScope() {
  DirectoryAccessService access=mock(DirectoryAccessService.class);
  ContactVisibilityService policy=new ContactVisibilityService(access);
  Resident subject=new Resident(); subject.setId(1L); subject.setIsActive(true);
  Resident peer=new Resident(); peer.setId(2L); peer.setIsActive(true);
  Building building=new Building(); building.setId(10L);
  when(access.canReadBuilding(peer,building)).thenReturn(true);
  assertFalse(policy.maySeePhone(peer,building,subject));
  subject.setSharePhone(true);
  assertTrue(policy.maySeePhone(peer,building,subject));
  assertFalse(policy.maySeeEmail(peer,building,subject));
  assertFalse(policy.maySeeEmergency(peer,building,subject));
  when(access.canReadBuilding(peer,building)).thenReturn(false);
  assertFalse(policy.maySeePhone(peer,building,subject));
  assertTrue(policy.maySeeEmergency(subject,building,subject));
 }
}

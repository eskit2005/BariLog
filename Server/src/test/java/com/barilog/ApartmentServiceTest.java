package com.barilog;

import com.barilog.dtos.request.ApartmentRequest;
import com.barilog.dtos.request.BuildingRequest;
import com.barilog.dtos.request.FloorRequest;
import com.barilog.dtos.request.OccupancyUpdateRequest;
import com.barilog.dtos.response.ApartmentResponse;
import com.barilog.dtos.response.BuildingResponse;
import com.barilog.dtos.response.FloorResponse;
import com.barilog.dtos.response.OccupancyStatsResponse;
import com.barilog.entities.*;
import com.barilog.exceptions.DuplicateResourceException;
import com.barilog.mappers.*;
import com.barilog.repositories.*;
import com.barilog.services.ApartmentService;
import com.barilog.services.AuthService;
import com.barilog.services.BuildingService;
import com.barilog.services.DirectoryAccessService;
import com.barilog.services.ContactVisibilityService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ApartmentServiceTest {

    @Mock
    private ApartmentRepository apartmentRepository;
    @Mock
    private BuildingRepository buildingRepository;
    @Mock
    private FloorRepository floorRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private OccupancyHistoryRepository occupancyHistoryRepository;
    @Mock
    private AuthService authService;

    private final ApartmentMapper apartmentMapper = new ApartmentMapperImpl();
    private final OccupancyHistoryMapper occupancyHistoryMapper = new OccupancyHistoryMapperImpl();
    private final BuildingMapper buildingMapper = new BuildingMapperImpl();
    private final FloorMapper floorMapper = new FloorMapperImpl();

    private ApartmentService apartmentService;
    private BuildingService buildingService;
    private DirectoryAccessService directoryAccess = mock(DirectoryAccessService.class);
    private ContactVisibilityService contactVisibility = mock(ContactVisibilityService.class);

    private User manager;
    private Building building;
    private Floor floor;

    @BeforeEach
    void setUp() {
        apartmentService = new ApartmentService(
                apartmentRepository,
                buildingRepository,
                floorRepository,
                userRepository,
                occupancyHistoryRepository,
                apartmentMapper,
                occupancyHistoryMapper,
                authService, directoryAccess, contactVisibility
        );

        buildingService = new BuildingService(
                buildingRepository,
                floorRepository,
                apartmentRepository,
                userRepository,
                buildingMapper,
                floorMapper, directoryAccess
        );

        manager = new Manager();
        manager.setId(1L);
        manager.setName("Ibrahim Manager");
        manager.setEmail("ibrahim@barilog.com");
        manager.setRole("MANAGER");
        manager.setIsActive(true);
        lenient().when(directoryAccess.currentActor()).thenReturn(manager);
        lenient().when(contactVisibility.redactApartment(any(), any(), any())).thenAnswer(inv -> inv.getArgument(2));

        building = new Building();
        building.setId(10L);
        building.setName("Green Valley Tower");
        building.setAddress("Road 12, Banani, Dhaka");
        building.setTotalFloors(10);
        building.setManager(manager);

        floor = new Floor();
        floor.setId(100L);
        floor.setBuilding(building);
        floor.setFloorNumber(4);
        floor.setBlockWing("Main");
    }

    @Test
    void testCreateApartment_Success() {
        when(authService.getLoggedUser()).thenReturn(manager);
        when(buildingRepository.findById(10L)).thenReturn(Optional.of(building));
        when(floorRepository.findById(100L)).thenReturn(Optional.of(floor));
        when(apartmentRepository.existsByBuildingIdAndUnitNumber(10L, "4A")).thenReturn(false);

        Apartment savedApt = new Apartment();
        savedApt.setId(500L);
        savedApt.setBuilding(building);
        savedApt.setFloor(floor);
        savedApt.setUnitNumber("4A");
        savedApt.setSizeSqft(new BigDecimal("1450.00"));
        savedApt.setBhkType("3 BHK");
        savedApt.setOccupancyStatus(OccupancyStatus.VACANT);

        when(apartmentRepository.save(any(Apartment.class))).thenReturn(savedApt);

        ApartmentRequest req = new ApartmentRequest();
        req.setBuildingId(10L);
        req.setFloorId(100L);
        req.setUnitNumber("4A");
        req.setSizeSqft(new BigDecimal("1450.00"));
        req.setBhkType("3 BHK");
        req.setOccupancyStatus(OccupancyStatus.VACANT);

        ApartmentResponse res = apartmentService.createApartment(req);

        assertNotNull(res);
        assertEquals("4A", res.getUnitNumber());
        assertEquals(OccupancyStatus.VACANT, res.getOccupancyStatus());
        verify(occupancyHistoryRepository, times(1)).save(any(OccupancyHistory.class));
    }

    @Test
    void testCreateApartment_DuplicateUnitThrowsException() {
        when(buildingRepository.findById(10L)).thenReturn(Optional.of(building));
        when(floorRepository.findById(100L)).thenReturn(Optional.of(floor));
        when(apartmentRepository.existsByBuildingIdAndUnitNumber(10L, "4A")).thenReturn(true);

        ApartmentRequest req = new ApartmentRequest();
        req.setBuildingId(10L);
        req.setFloorId(100L);
        req.setUnitNumber("4A");
        req.setSizeSqft(new BigDecimal("1450.00"));
        req.setBhkType("3 BHK");

        assertThrows(DuplicateResourceException.class, () -> apartmentService.createApartment(req));
        verify(apartmentRepository, never()).save(any());
    }

    @Test
    void testUpdateOccupancy_VacantToRented() {
        when(authService.getLoggedUser()).thenReturn(manager);

        Apartment existing = new Apartment();
        existing.setId(500L);
        existing.setBuilding(building);
        existing.setFloor(floor);
        existing.setUnitNumber("4A");
        existing.setOccupancyStatus(OccupancyStatus.VACANT);

        User tenant = new Resident();
        tenant.setId(200L);
        tenant.setName("Sarah Tenant");
        tenant.setEmail("sarah@tenant.com");

        when(apartmentRepository.findById(500L)).thenReturn(Optional.of(existing));
        when(userRepository.findById(200L)).thenReturn(Optional.of(tenant));
        when(apartmentRepository.save(any(Apartment.class))).thenAnswer(inv -> inv.getArgument(0));

        OccupancyUpdateRequest updateReq = new OccupancyUpdateRequest();
        updateReq.setNewStatus(OccupancyStatus.RENTED);
        updateReq.setNewResidentId(200L);
        updateReq.setNotes("New lease signed for 1 year");
        updateReq.setEffectiveDate(LocalDate.now());

        ApartmentResponse updated = apartmentService.updateOccupancyStatus(500L, updateReq);

        assertEquals(OccupancyStatus.RENTED, updated.getOccupancyStatus());
        assertEquals(200L, updated.getCurrentResidentId());
        verify(occupancyHistoryRepository, times(1)).save(any(OccupancyHistory.class));
    }

    @Test
    void testBuildingOccupancyStats() {
        when(buildingRepository.findById(10L)).thenReturn(Optional.of(building));
        when(apartmentRepository.countByBuildingId(10L)).thenReturn(50L);
        when(apartmentRepository.countByBuildingIdAndOccupancyStatus(10L, OccupancyStatus.VACANT)).thenReturn(10L);
        when(apartmentRepository.countByBuildingIdAndOccupancyStatus(10L, OccupancyStatus.OWNER_OCCUPIED)).thenReturn(25L);
        when(apartmentRepository.countByBuildingIdAndOccupancyStatus(10L, OccupancyStatus.RENTED)).thenReturn(15L);

        OccupancyStatsResponse stats = buildingService.getOccupancyStats(10L);

        assertEquals(50L, stats.getTotalUnits());
        assertEquals(10L, stats.getVacantUnits());
        assertEquals(25L, stats.getOwnerOccupiedUnits());
        assertEquals(15L, stats.getRentedUnits());
        // 40 occupied out of 50 = 80.0%
        assertEquals(80.0, stats.getOccupancyRatePercentage());
    }
}

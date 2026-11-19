package com.barilog;

import com.barilog.dtos.request.BuildingRequest;
import com.barilog.dtos.request.FloorRequest;
import com.barilog.dtos.response.BuildingResponse;
import com.barilog.dtos.response.FloorResponse;
import com.barilog.dtos.response.OccupancyStatsResponse;
import com.barilog.entities.Building;
import com.barilog.entities.Floor;
import com.barilog.entities.Manager;
import com.barilog.entities.OccupancyStatus;
import com.barilog.entities.User;
import com.barilog.exceptions.DuplicateResourceException;
import com.barilog.exceptions.ResourceNotFoundException;
import com.barilog.mappers.BuildingMapper;
import com.barilog.mappers.BuildingMapperImpl;
import com.barilog.mappers.FloorMapper;
import com.barilog.mappers.FloorMapperImpl;
import com.barilog.repositories.ApartmentRepository;
import com.barilog.repositories.BuildingRepository;
import com.barilog.repositories.FloorRepository;
import com.barilog.repositories.UserRepository;
import com.barilog.services.BuildingService;
import com.barilog.services.DirectoryAccessService;
import com.barilog.services.ContactVisibilityService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BuildingServiceTest {

    @Mock
    private BuildingRepository buildingRepository;
    @Mock
    private FloorRepository floorRepository;
    @Mock
    private ApartmentRepository apartmentRepository;
    @Mock
    private UserRepository userRepository;

    private final BuildingMapper buildingMapper = new BuildingMapperImpl();
    private final FloorMapper floorMapper = new FloorMapperImpl();

    private BuildingService buildingService;
    private DirectoryAccessService directoryAccess = mock(DirectoryAccessService.class);
    private ContactVisibilityService contactVisibility = mock(ContactVisibilityService.class);

    private User manager;
    private Building building;

    @BeforeEach
    void setUp() {
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
        manager.setName("Manager Alice");
        manager.setEmail("alice@barilog.com");
        manager.setRole("MANAGER");
        manager.setIsActive(true);
        lenient().when(directoryAccess.currentActor()).thenReturn(manager);
        lenient().when(directoryAccess.canReadBuilding(any(), any())).thenReturn(true);
        lenient().when(directoryAccess.requireReadAccess(any(), any())).thenReturn(building);
        lenient().when(contactVisibility.redactApartment(any(), any(), any())).thenAnswer(inv -> inv.getArgument(2));

        building = new Building();
        building.setId(10L);
        building.setName("Sunrise Heights");
        building.setAddress("Dhanmondi, Dhaka");
        building.setTotalFloors(12);
        building.setManager(manager);
    }

    @Test
    void testCreateBuilding_Success() {
        when(buildingRepository.existsByNameIgnoreCase("Sunrise Heights")).thenReturn(false);
        when(userRepository.findById(1L)).thenReturn(Optional.of(manager));
        when(buildingRepository.save(any(Building.class))).thenAnswer(inv -> {
            Building b = inv.getArgument(0);
            b.setId(10L);
            return b;
        });

        BuildingRequest req = new BuildingRequest();
        req.setName("Sunrise Heights");
        req.setAddress("Dhanmondi, Dhaka");
        req.setTotalFloors(12);
        req.setManagerId(1L);

        BuildingResponse res = buildingService.createBuilding(req);

        assertNotNull(res);
        assertEquals(10L, res.getId());
        assertEquals("Sunrise Heights", res.getName());
        assertEquals(12, res.getTotalFloors());
        assertEquals("Manager Alice", res.getManagerName());
        verify(buildingRepository, times(1)).save(any(Building.class));
    }

    @Test
    void testCreateBuilding_DuplicateNameThrowsException() {
        when(buildingRepository.existsByNameIgnoreCase("Sunrise Heights")).thenReturn(true);

        BuildingRequest req = new BuildingRequest();
        req.setName("Sunrise Heights");
        req.setAddress("Dhanmondi, Dhaka");
        req.setTotalFloors(12);

        assertThrows(DuplicateResourceException.class, () -> buildingService.createBuilding(req));
        verify(buildingRepository, never()).save(any());
    }

    @Test
    void testAddFloor_Success() {
        when(buildingRepository.findById(10L)).thenReturn(Optional.of(building));
        when(floorRepository.existsByBuildingIdAndFloorNumberAndBlockWing(10L, 5, "North Wing")).thenReturn(false);
        when(floorRepository.save(any(Floor.class))).thenAnswer(inv -> {
            Floor f = inv.getArgument(0);
            f.setId(105L);
            return f;
        });

        FloorRequest req = new FloorRequest();
        req.setFloorNumber(5);
        req.setBlockWing("North Wing");
        req.setDescription("5th floor north wing apartments");

        FloorResponse res = buildingService.addFloor(10L, req);

        assertNotNull(res);
        assertEquals(105L, res.getId());
        assertEquals(5, res.getFloorNumber());
        assertEquals("North Wing", res.getBlockWing());
        assertEquals(10L, res.getBuildingId());
    }

    @Test
    void testAddFloor_FloorNumberExceedsTotalFloorsThrowsException() {
        when(buildingRepository.findById(10L)).thenReturn(Optional.of(building));

        FloorRequest req = new FloorRequest();
        req.setFloorNumber(15); // building has only 12 floors
        req.setBlockWing("Main");

        assertThrows(IllegalArgumentException.class, () -> buildingService.addFloor(10L, req));
        verify(floorRepository, never()).save(any());
    }

    @Test
    void testAddFloor_DuplicateFloorThrowsException() {
        when(buildingRepository.findById(10L)).thenReturn(Optional.of(building));
        when(floorRepository.existsByBuildingIdAndFloorNumberAndBlockWing(10L, 3, "Main")).thenReturn(true);

        FloorRequest req = new FloorRequest();
        req.setFloorNumber(3);
        req.setBlockWing("Main");

        assertThrows(DuplicateResourceException.class, () -> buildingService.addFloor(10L, req));
        verify(floorRepository, never()).save(any());
    }

    @Test
    void testGetFloorsByBuilding() {
        when(buildingRepository.existsById(10L)).thenReturn(true);

        Floor f1 = new Floor();
        f1.setId(1L);
        f1.setBuilding(building);
        f1.setFloorNumber(1);
        f1.setBlockWing("Main");

        Floor f2 = new Floor();
        f2.setId(2L);
        f2.setBuilding(building);
        f2.setFloorNumber(2);
        f2.setBlockWing("Main");

        when(floorRepository.findByBuildingIdOrderByFloorNumberAsc(10L)).thenReturn(List.of(f1, f2));

        List<FloorResponse> list = buildingService.getFloorsByBuilding(10L);

        assertEquals(2, list.size());
        assertEquals(1, list.get(0).getFloorNumber());
        assertEquals(2, list.get(1).getFloorNumber());
    }

    @Test
    void testGetBuildingById_NotFoundThrowsException() {
        when(buildingRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> buildingService.getBuildingById(999L));
    }
}
